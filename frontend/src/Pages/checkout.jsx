import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { fetchCart, createCheckoutSessionCombined } from '../Services/api';
import CheckoutView from '../Components/CheckoutView';
import { normalizeCart } from '../Components/cartModel';
import { checkoutPayload, checkoutResult } from '../Components/checkoutModel';

const Checkout = () => {
  const { userId, user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState('');
  const [logoutLoading, setLogoutLoading] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    if (authLoading) return;
    if (!userId) { navigate('/login', { replace: true }); return; }
    let cancelled = false;
    setLoading(true); setError('');
    fetchCart().then(data => { if (!cancelled) setItems(normalizeCart(data)); })
      .catch(() => { if (!cancelled) setError('We couldn’t load your checkout. Please try again.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [authLoading, userId, navigate, reload]);
  const pay = async form => {
    if (lock.current || loading || error || result?.kind === 'pending' || result?.kind === 'redirect') return;
    lock.current = true; setSubmitting(true); setResult(null);
    try {
      const response = await createCheckoutSessionCombined(checkoutPayload(form, items, userId));
      const next = checkoutResult(response, form.method);
      setResult(next);
      if (next.kind === 'redirect') window.location.assign(next.url);
    } catch {
      setResult({ kind: 'error', message: 'We couldn’t confirm whether your payment request started. Check your orders and mobile wallet before trying again. Your details are still here.' });
    } finally { lock.current = false; setSubmitting(false); }
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
  return <CheckoutView user={user?.data?.user || user} items={items} loading={loading} error={error} submitting={submitting} result={result} notice={notice} logoutLoading={logoutLoading} onRetry={() => setReload(value => value + 1)} onSubmit={pay} onNavigate={handleNavigate} onLogout={handleLogout} />;
};
export default Checkout;
