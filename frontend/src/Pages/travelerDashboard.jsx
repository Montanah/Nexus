import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { assignFulfillment, getAvailableProducts, getTravelerEarnings, getTravelerOrders, updateDeliveryStatus, uploadDeliveryProof } from '../Services/api';
import TravelerDashboardView from '../Components/TravelerDashboardView';
import { isAvailable, nextStatus, normalizeProducts, validateProofFile } from '../Components/travelerDashboardModel';

const readProof = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve({ base64: reader.result, type: file.type, size: file.size });
  reader.onerror = () => reject(new Error('This file could not be read. Please choose it again.'));
  reader.onabort = () => reject(new Error('File reading was interrupted. Please try again.'));
  reader.readAsDataURL(file);
});

const TravelerDashboard = () => {
  const navigate = useNavigate();
  const { user, userId, logout, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState({ products: true, deliveries: true, earnings: true });
  const [errors, setErrors] = useState({});
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(null);
  const actionLock = useRef(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) { navigate('/login', { replace: true }); return; }
    let cancelled = false;
    setLoading({ products: true, deliveries: true, earnings: true });
    setErrors({});
    const loadResource = async (key, fetcher, update) => {
      try {
        const data = await fetcher();
        if (!cancelled) update(data);
      } catch {
        if (!cancelled) setErrors(previous => ({ ...previous, [key]: `We couldn’t load ${key === 'products' ? 'available deliveries' : `your ${key}`}. Please try again.` }));
      } finally {
        if (!cancelled) setLoading(previous => ({ ...previous, [key]: false }));
      }
    };
    loadResource('products', async () => {
      try { return await getAvailableProducts(); }
      catch (error) { if (error.response?.status === 404) return []; throw error; }
    }, data => setProducts(normalizeProducts(data).filter(isAvailable)));
    // The existing earnings endpoint also creates a first-time traveler profile.
    // Let it finish before requesting that profile's claimed deliveries.
    loadResource('earnings', getTravelerEarnings, setEarnings).then(() => {
      if (!cancelled) loadResource('deliveries', () => getTravelerOrders(userId), data => setDeliveries(previous => normalizeProducts(data).map(product => {
        const pendingSync = previous.find(item => item.productId === product.productId)?.proofUploaded;
        return pendingSync && product.deliveryStatus === 'Client Confirmed' ? { ...product, proofUploaded: true } : product;
      })));
    });
    return () => { cancelled = true; };
  }, [authLoading, userId, navigate, reload]);

  const beginAction = (id, type) => {
    if (actionLock.current) return false;
    actionLock.current = true;
    setBusy({ id, type }); setActionError(null); setNotice('');
    return true;
  };
  const endAction = () => { actionLock.current = false; setBusy(null); };
  const patchDelivery = (id, patch) => setDeliveries(previous => previous.map(product => product.productId === id ? { ...product, ...patch } : product));
  const refreshEarnings = async () => {
    try {
      setEarnings(await getTravelerEarnings());
      setErrors(previous => ({ ...previous, earnings: '' }));
    } catch { setErrors(previous => ({ ...previous, earnings: 'Earnings are unavailable.' })); }
  };

  const handleClaim = async id => {
    const product = products.find(item => item.productId === id);
    if (!product || !isAvailable(product) || loading.deliveries || errors.deliveries || !beginAction(id, 'claim')) return false;
    try {
      const response = await assignFulfillment(id);
      // The claim endpoint returns identifiers, not a replacement product object.
      setProducts(previous => previous.filter(item => item.productId !== id));
      setDeliveries(previous => [...previous.filter(item => item.productId !== id), { ...product, deliveryStatus: 'Assigned', claimedBy: response?.data?.travelerId || userId }]);
      setNotice('Delivery accepted. You’ll find it in My deliveries, ready for the next step.');
      return true;
    } catch {
      setActionError({ id, message: 'We couldn’t accept this delivery. It may have been claimed already. Refresh and try again.' });
      return false;
    } finally { endAction(); }
  };

  const handleAdvance = async id => {
    const product = deliveries.find(item => item.productId === id);
    const status = product && nextStatus(product);
    if (!status || !beginAction(id, 'status')) return;
    try {
      await updateDeliveryStatus(id, status);
      patchDelivery(id, { deliveryStatus: status, proofUploaded: false, isDelivered: status === 'Complete' });
      setNotice(status === 'Shipped' ? 'Delivery marked as shipped.' : status === 'Traveler Confirmed' ? 'Handover recorded. The client can now confirm receipt.' : 'Delivery completed. Your proof has been saved.');
      if (status === 'Complete') await refreshEarnings();
    } catch { setActionError({ id, message: 'We couldn’t update the delivery status. Please try again.' }); }
    finally { endAction(); }
  };

  const handleUpload = async (id, file) => {
    const product = deliveries.find(item => item.productId === id);
    if (!product || product.deliveryStatus !== 'Client Confirmed' || product.proofUploaded) return;
    const validation = validateProofFile(file);
    if (validation) { setActionError({ id, message: validation }); return; }
    if (!beginAction(id, 'proof')) return;
    let proofSaved = false;
    try {
      const result = await uploadDeliveryProof(id, await readProof(file));
      if (!result.success) throw new Error(result.message || 'Proof upload failed. Please try again.');
      proofSaved = true;
      patchDelivery(id, { proofUploaded: true });
      // Proof completes the order item; this existing endpoint synchronizes the
      // Product status read by the claimed-products endpoint. Never run it on failure.
      await updateDeliveryStatus(id, 'Complete');
      patchDelivery(id, { deliveryStatus: 'Complete', proofUploaded: false, isDelivered: true });
      setNotice('Delivery proof saved. This journey is complete.');
      await refreshEarnings();
    } catch (error) {
      setActionError({ id, message: proofSaved ? 'Your proof was saved, but the delivery status could not be updated. Select Finish delivery to retry.' : error.message || 'We couldn’t upload your proof. Please try again.' });
    } finally { endAction(); }
  };

  const handleLogout = async () => {
    if (logoutLoading || actionLock.current) return;
    setLogoutLoading(true); setActionError(null);
    try { await logout(); }
    catch { setActionError({ message: 'We couldn’t log you out. Please try again.' }); }
    finally { setLogoutLoading(false); }
  };
  const handleNavigate = (path, options) => {
    if (path.includes('#')) { window.location.assign(path); return; }
    navigate(path, options); window.scrollTo({ top: 0 });
  };

  if (authLoading) return <div className="cd-auth-loading" role="status">Loading your account…</div>;
  if (!userId) return null;
  return <TravelerDashboardView user={user?.data?.user || user} products={products} deliveries={deliveries} earnings={earnings} loading={loading} errors={errors} busy={busy} actionError={actionError} notice={notice} logoutLoading={logoutLoading} onRetry={() => { if (!actionLock.current) setReload(value => value + 1); }} onNavigate={handleNavigate} onClaim={handleClaim} onAdvance={handleAdvance} onUpload={handleUpload} onLogout={handleLogout} />;
};
export default TravelerDashboard;
