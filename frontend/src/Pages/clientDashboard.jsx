import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { fetchOrders, updateProductDeliveryStatus } from '../Services/api';
import ClientDashboardView from '../Components/ClientDashboardView';
import { applyDeliveryConfirmation, getItems, getItemStatus, getProductId } from '../Components/clientDashboardModel';

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user, userId, logout, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmingId, setConfirmingId] = useState('');
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) { navigate('/login', { replace: true }); return; }
    let cancelled = false;
    const loadOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetchOrders();
        if (!cancelled) setOrders(Array.isArray(response?.data?.orders) ? response.data.orders : []);
      } catch {
        if (!cancelled) setError('We couldn’t load your orders. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadOrders();
    return () => { cancelled = true; };
  }, [userId, authLoading, navigate, reload]);

  const handleConfirm = async productId => {
    if (confirmingId) return;
    const item = orders.filter(order => order.deliveryStatus !== 'Cancelled').flatMap(getItems).find(candidate => getProductId(candidate) === productId);
    if (!item || getItemStatus(item) !== 'Traveler Confirmed') return;
    setConfirmingId(productId);
    setActionError('');
    setNotice('');
    try {
      await updateProductDeliveryStatus(productId, 'Client Confirmed');
      setOrders(previous => applyDeliveryConfirmation(previous, productId));
      setNotice('Receipt confirmed. Your traveler can now submit the delivery proof.');
    } catch {
      setActionError('We couldn’t confirm receipt. Please try again.');
    } finally {
      setConfirmingId('');
    }
  };

  const handleLogout = async () => {
    if (logoutLoading) return;
    setLogoutLoading(true);
    setActionError('');
    try { await logout(); }
    catch { setActionError('We couldn’t log you out. Please try again.'); }
    finally { setLogoutLoading(false); }
  };

  const handleNavigate = (path, options) => {
    if (path.includes('#')) { window.location.assign(path); return; }
    navigate(path, options);
    window.scrollTo({ top: 0 });
  };

  if (authLoading) return <div className="cd-auth-loading" role="status">Loading your account…</div>;
  if (!userId) return null;
  const profile = user?.data?.user || user;
  return <ClientDashboardView user={profile} orders={orders} loading={loading} error={error} actionError={actionError} notice={notice} confirmingId={confirmingId} logoutLoading={logoutLoading} onRetry={() => setReload(value => value + 1)} onNavigate={handleNavigate} onConfirm={handleConfirm} onLogout={handleLogout} />;
};
export default ClientDashboard;
