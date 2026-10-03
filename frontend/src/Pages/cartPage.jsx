import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { fetchCart, deleteCartItem } from '../Services/api';
import CartView from '../Components/CartView';
import { cartTotals, normalizeCart, removeCartItem } from '../Components/cartModel';

const CartPage = () => {
  const { user, userId, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState('');
  const [removingId, setRemovingId] = useState('');
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [reload, setReload] = useState(0);
  const mutationLock = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) { navigate('/login', { replace: true }); return; }
    let cancelled = false;
    setLoading(true); setError(''); setActionError(null); setNotice('');
    const load = async () => {
      try {
        const data = await fetchCart();
        if (!cancelled) setItems(normalizeCart(data));
      } catch {
        if (!cancelled) setError('We couldn’t load your cart. Please try again.');
      } finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [authLoading, userId, navigate, reload]);

  const remove = async id => {
    const item = items.find(candidate => candidate.productId === id);
    if (!id || !item || mutationLock.current || loading) return false;
    mutationLock.current = true; setRemovingId(id); setActionError(null); setNotice('');
    try {
      await deleteCartItem(id);
      // The DELETE response has a different cart shape. Update only the
      // confirmed removal; keep other rows and their server-provided prices.
      setItems(previous => removeCartItem(previous, id));
      setNotice(`${item.productName} was removed from your cart.`);
      return true;
    } catch {
      setActionError({ id, message: 'We couldn’t confirm removal. Refresh your cart or try again.' });
      return false;
    } finally { mutationLock.current = false; setRemovingId(''); }
  };
  const handleLogout = async () => {
    if (logoutLoading || mutationLock.current) return;
    setLogoutLoading(true); setActionError(null);
    try { await logout(); }
    catch { setActionError({ message: 'We couldn’t log you out. Please try again.' }); }
    finally { setLogoutLoading(false); }
  };
  const handleNavigate = (path, options) => {
    if (path === '/checkout' && (loading || error || mutationLock.current || !cartTotals(items).canCheckout)) return;
    if (path.includes('#')) { window.location.assign(path); return; }
    navigate(path, options); window.scrollTo({ top: 0 });
  };

  if (authLoading) return <div className="cd-auth-loading" role="status">Loading your account…</div>;
  if (!userId) return null;
  return <CartView user={user?.data?.user || user} items={items} loading={loading} error={error} removingId={removingId} actionError={actionError} notice={notice} logoutLoading={logoutLoading} onRetry={() => { if (!mutationLock.current) setReload(value => value + 1); }} onRemove={remove} onNavigate={handleNavigate} onLogout={handleLogout} />;
};
export default CartPage;
