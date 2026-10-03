import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CheckoutView from '../Components/CheckoutView';
import { normalizeCart } from '../Components/cartModel';
import { previewCartItems } from './cartFixtures';

const CheckoutPreview = () => {
  const navigate = useNavigate(), location = useLocation();
  const [items, setItems] = useState(() => normalizeCart(location.state?.previewCart || previewCartItems));
  const [scenario, setScenario] = useState('sample');
  const [revision, setRevision] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState('');
  const pending = useRef(null);
  const cancel = () => { if (pending.current) { clearTimeout(pending.current.timer); pending.current.resolve(); pending.current = null; } };
  useEffect(() => () => cancel(), []);
  const reset = (next = 'sample') => {
    cancel(); setScenario(next); setRevision(value => value + 1); setSubmitting(false); setResult(null); setNotice('');
    setItems(normalizeCart(next === 'empty' ? [] : next === 'unavailable' ? [...previewCartItems, { productId: null, productName: 'Unavailable product', quantity: 1, productFee: 0, finalCharge: 0 }] : next === 'whole' ? previewCartItems.map((item, index) => index ? item : { ...item, productFee: 14940, finalCharge: 14940 * 1.15, previewForm: { ...item.previewForm, productPrice: '14940' } }) : previewCartItems));
  };
  const pay = form => {
    if (pending.current) return Promise.resolve();
    setSubmitting(true); setResult(null);
    return new Promise(resolve => {
      pending.current = { resolve, timer: setTimeout(() => {
        pending.current = null; setSubmitting(false);
        if (scenario === 'payment-error') {
          setResult({ kind: 'error', sample: true, message: 'Sample request failed. Your details are still here. No payment request was sent. Try again to preview the next step.' });
          setScenario('sample');
        } else {
          setResult({ kind: form.method === 'paystack' ? 'redirect' : 'pending', sample: true, message: form.method === 'paystack' ? 'In the connected app, you would continue to Paystack. This preview does not redirect, create an order, or take a payment.' : 'In the connected app, you would approve a request on your phone and wait for confirmation. No request, order, or payment was created here.' });
        }
        resolve();
      }, 700) };
    });
  };
  const navigatePreview = path => {
    if (path === '/cart' || path === '/new-order') { navigate(`/preview${path}`, { state: { previewCart: items } }); return; }
    if (path === '/client-dashboard') { navigate('/preview/client-dashboard'); return; }
    if (path === '/' || path.includes('#')) { window.location.assign(path); return; }
    setNotice('Preview only: account settings opens after signing in to the connected app.');
  };
  return <CheckoutView key={revision} user={{ name: 'Alex Morgan', email: 'alex@example.test' }} items={items} loading={scenario === 'loading'} error={scenario === 'error' ? 'We couldn’t load your checkout. Please try again.' : ''} submitting={submitting} result={result} notice={notice} onRetry={() => reset()} onSubmit={pay} onNavigate={navigatePreview} onLogout={() => navigate('/login')} previewControls={
    <div className="cd-preview-bar"><div><strong>Local preview · Sample data</strong><small>Explore checkout without sending a payment request.</small></div><div className="cd-preview-controls"><label htmlFor="checkout-preview-state">Preview state</label><select id="checkout-preview-state" value={scenario} onChange={event => reset(event.target.value)}><option value="sample">Sample checkout</option><option value="whole">Whole-shilling cart</option><option value="empty">Empty cart</option><option value="loading">Loading</option><option value="error">Loading error</option><option value="payment-error">Payment request error</option><option value="unavailable">Unavailable item</option></select><button onClick={() => reset()}>Reset preview</button><Link to="/preview/cart" state={{ previewCart: items }}>Your cart</Link><Link to="/login">Back to login</Link></div></div>
  } />;
};
export default CheckoutPreview;
