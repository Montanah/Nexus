import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { assignFulfillment, getAvailableProducts, getTravelerEarnings, getTravelerOrders, updateDeliveryStatus, uploadDeliveryProof } from '../Services/api';
import DeliveryDetailsView from '../Components/DeliveryDetailsView';
import { claimAcknowledged, deliveryAction, deliveryContext, readDeliveryProof, statusAcknowledged } from '../Components/deliveryDetailsModel';
import { validateProofFile } from '../Components/travelerDashboardModel';

const DeliverySession = ({ productId, userId, user, logout }) => {
  const navigate = useNavigate();
  const [resource, setResource] = useState({ phase: 'loading', context: null });
  const [reload, setReload] = useState(0), [busy, setBusy] = useState('');
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const lock = useRef(false), mounted = useRef(true), proofSaved = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let cancelled = false;
    setResource(previous => ({ ...previous, phase: 'loading' })); setError(''); setNotice('');
    Promise.all([
      getAvailableProducts().catch(failure => { if (failure.response?.status === 404) return []; throw failure; }),
      getTravelerOrders(userId).catch(failure => {
        if (failure.response?.status === 404 && failure.response?.data?.data?.message === 'Traveler not found') return [];
        throw failure;
      }),
    ]).then(([available, claimed]) => {
      if (cancelled) return;
      const context = deliveryContext(available, claimed, productId);
      if (context?.owned && context.product.deliveryStatus === 'Client Confirmed' && proofSaved.current) context.product.proofUploaded = true;
      setResource({ context, phase: context ? 'ready' : 'missing' });
    }).catch(() => { if (!cancelled) setResource({ phase: 'error', context: null }); });
    return () => { cancelled = true; };
  }, [productId, userId, reload]);

  const begin = type => {
    if (lock.current || resource.phase !== 'ready') return false;
    lock.current = true; setBusy(type); setError(''); setNotice(''); return true;
  };
  const end = () => { lock.current = false; if (mounted.current) setBusy(''); };
  const patch = changes => { if (mounted.current) setResource(previous => ({ ...previous, context: { ...previous.context, owned: true, available: false, product: { ...previous.context.product, ...changes } } })); };
  const claim = async () => {
    if (deliveryAction(resource.context) !== 'claim' || !begin('claim')) return;
    try {
      // The existing API initializes first-time traveler profiles on this endpoint.
      await getTravelerEarnings();
      if (!mounted.current) return;
      const response = await assignFulfillment(productId);
      if (!claimAcknowledged(response, productId)) throw new Error('Claim was not acknowledged.');
      patch({ deliveryStatus: 'Assigned', claimedBy: response.data.travelerId });
      if (mounted.current) setNotice('Delivery accepted. You can now follow the next steps here or in My deliveries.');
    } catch { if (mounted.current) setError('We couldn’t confirm this delivery was accepted. Refresh the details before trying again; it may already have been claimed.'); }
    finally { end(); }
  };
  const advance = async () => {
    const action = deliveryAction(resource.context);
    const status = { ship: 'Shipped', handover: 'Traveler Confirmed', finish: 'Complete' }[action];
    if (!status || !begin('status')) return;
    try {
      const response = await updateDeliveryStatus(productId, status);
      if (!statusAcknowledged(response, productId, status)) throw new Error('Status was not acknowledged.');
      patch({ deliveryStatus: status, ...(status === 'Complete' ? { isDelivered: true, proofUploaded: false } : {}) });
      if (mounted.current) setNotice(status === 'Shipped' ? 'Delivery marked as shipped.' : status === 'Traveler Confirmed' ? 'Handover recorded. The client can now confirm receipt.' : 'Delivery completed. Your proof has been saved.');
    } catch { if (mounted.current) setError('We couldn’t confirm the status update. Refresh the details or try again.'); }
    finally { end(); }
  };
  const upload = async file => {
    if (deliveryAction(resource.context) !== 'proof') return;
    const validation = validateProofFile(file); if (validation) { setError(validation); return; }
    if (!begin('proof')) return;
    let saved = false;
    try {
      const photo = await readDeliveryProof(file);
      if (!mounted.current) return;
      const result = await uploadDeliveryProof(productId, photo);
      if (!result.success) throw new Error('Proof was not acknowledged.');
      saved = true; proofSaved.current = true; patch({ proofUploaded: true });
      if (!mounted.current) return;
      // The proof endpoint completes the order item; synchronize Product separately.
      const response = await updateDeliveryStatus(productId, 'Complete');
      if (!statusAcknowledged(response, productId, 'Complete')) throw new Error('Status was not acknowledged.');
      patch({ deliveryStatus: 'Complete', proofUploaded: false, isDelivered: true });
      if (mounted.current) setNotice('Delivery proof saved. This journey is complete.');
    } catch { if (mounted.current) setError(saved ? 'Your proof was saved, but the delivery status could not be updated. Select Finish delivery to retry.' : 'We couldn’t confirm your proof was saved. Your selected file is still here. Refresh the details or try again.'); }
    finally { end(); }
  };
  const signOut = async () => {
    if (lock.current) return;
    lock.current = true; setBusy('logout'); setError(''); setNotice('');
    try { await logout(); }
    catch { if (mounted.current) setError('We couldn’t sign you out. Please try again.'); }
    finally { end(); }
  };
  const navigateTo = path => { if (!lock.current) { navigate(path); window.scrollTo({ top: 0 }); } };
  return <DeliveryDetailsView user={user} context={resource.context} phase={resource.phase} busy={busy} error={error} notice={notice} onClaim={claim} onAdvance={advance} onUpload={upload} onRetry={() => { if (!lock.current) setReload(value => value + 1); }} onNavigate={navigateTo} onLogout={signOut} />;
};
DeliverySession.propTypes = { productId: PropTypes.string.isRequired, userId: PropTypes.string.isRequired, user: PropTypes.object, logout: PropTypes.func.isRequired };

const ProductDetails = () => {
  const { userId, user, loading, logout } = useAuth();
  const { productId } = useParams(), navigate = useNavigate();
  useEffect(() => { if (!loading && !userId) navigate('/login', { replace: true }); }, [loading, userId, navigate]);
  if (loading && !userId) return <div className="cd-auth-loading" role="status">Loading your account…</div>;
  if (!userId) return null;
  return <DeliverySession key={`${userId}:${productId}`} productId={productId} userId={userId} user={user?.data?.user || user} logout={logout} />;
};
export default ProductDetails;
