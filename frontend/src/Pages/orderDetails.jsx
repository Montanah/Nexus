import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { fetchOneOrder, updateProductDeliveryStatus } from '../Services/api';
import OrderDetailsView from '../Components/OrderDetailsView';
import { canConfirmReceipt, confirmOrderItem, receiptConfirmed, validateOrderDetails } from '../Components/orderDetailsModel';

const OrderDetails = () => {
  const { orderNumber } = useParams(), navigate = useNavigate();
  const { user, userId, loading: authLoading, logout } = useAuth();
  const key = JSON.stringify([userId, orderNumber]);
  const [resource, setResource] = useState(null), [reload, setReload] = useState(0);
  const [confirmingId, setConfirmingId] = useState(''), [actionError, setActionError] = useState(null), [notice, setNotice] = useState('');
  const [logoutLoading, setLogoutLoading] = useState(false);
  const lock = useRef(false), currentKey = useRef(key);
  currentKey.current = key;
  const current = resource?.key === key ? resource : null;
  useEffect(() => {
    if (authLoading) return;
    if (!userId) { navigate('/login', { replace: true }); return; }
    let cancelled = false;
    setResource(previous => ({ key, order: previous?.key === key ? previous.order : null, loading: true }));
    setActionError(null); setNotice('');
    fetchOneOrder(orderNumber).then(data => {
      const order = validateOrderDetails(data, orderNumber);
      if (!cancelled) setResource({ key, order, loading: false });
    }).catch(error => {
      if (!cancelled) setResource(previous => ({ ...previous, loading: false, error: error.response?.status === 404 ? 'not-found' : 'load' }));
    });
    return () => { cancelled = true; };
  }, [authLoading, userId, orderNumber, key, navigate, reload]);

  const confirm = async productId => {
    if (lock.current || current?.loading || current?.error || !canConfirmReceipt(current?.order, productId)) return false;
    lock.current = true; setConfirmingId(productId); setActionError(null); setNotice('');
    try {
      const response = await updateProductDeliveryStatus(productId, 'Client Confirmed');
      if (!receiptConfirmed(response, productId)) throw new Error('Receipt confirmation was not verified.');
      if (currentKey.current === key) {
        setResource(previous => previous?.key === key ? { ...previous, order: confirmOrderItem(previous.order, productId) } : previous);
        setNotice('Receipt confirmed. Your traveler can now finish the delivery proof.');
      }
      return true;
    } catch {
      if (currentKey.current === key) setActionError({ id: productId, message: 'We couldn’t confirm receipt. Refresh the order or try again.' });
      return false;
    } finally { lock.current = false; setConfirmingId(''); }
  };
  const handleLogout = async () => {
    if (lock.current || logoutLoading) return;
    setLogoutLoading(true); setNotice('');
    try { await logout(); } catch { setNotice('We couldn’t log you out. Please try again.'); }
    finally { setLogoutLoading(false); }
  };
  const handleNavigate = (path, options) => {
    if (lock.current) return;
    if (path.includes('#')) { window.location.assign(path); return; }
    navigate(path, options); window.scrollTo({ top: 0 });
  };
  if (authLoading) return <div className="cd-auth-loading" role="status">Loading your account…</div>;
  if (!userId) return null;
  return <OrderDetailsView key={key} user={user?.data?.user || user} order={current?.order} loading={!current || current.loading} error={current?.error} notice={notice} actionError={actionError} confirmingId={confirmingId} logoutLoading={logoutLoading} onRetry={() => { if (!lock.current) setReload(value => value + 1); }} onConfirm={confirm} onNavigate={handleNavigate} onLogout={handleLogout} />;
};
export default OrderDetails;
