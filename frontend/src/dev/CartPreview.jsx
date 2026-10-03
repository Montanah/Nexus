import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CartView from '../Components/CartView';
import { normalizeCart, removeCartItem } from '../Components/cartModel';
import { previewCartItems } from './cartFixtures';

const CartPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState(() => normalizeCart(location.state?.previewCart || previewCartItems));
  const [scenario, setScenario] = useState('sample');
  const [removingId, setRemovingId] = useState('');
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState('');
  const pending = useRef(null);
  const cancel = () => {
    if (pending.current) { clearTimeout(pending.current.timer); pending.current.resolve(false); pending.current = null; }
  };
  useEffect(() => () => cancel(), []);
  const reset = (next = 'sample') => {
    cancel(); setRemovingId(''); setActionError(null); setNotice(''); setScenario(next);
    setItems(normalizeCart(next === 'empty' ? [] : next === 'unavailable' ? [...previewCartItems, { productId: null, productName: 'Unavailable product', quantity: 1, productFee: 0, finalCharge: 0 }] : previewCartItems));
  };
  const remove = id => {
    if (pending.current) return Promise.resolve(false);
    const item = items.find(candidate => candidate.productId === id);
    if (!item) return Promise.resolve(false);
    setRemovingId(id); setActionError(null); setNotice('');
    return new Promise(resolve => {
      pending.current = { resolve, timer: setTimeout(() => {
        pending.current = null; setRemovingId('');
        if (scenario === 'remove-error') {
          setActionError({ id, message: 'Sample removal failed. Your item is still here. Try Remove again.' });
          setScenario('sample'); resolve(false); return;
        }
        setItems(previous => removeCartItem(previous, id));
        setNotice(`Sample ${item.productName} removed. No request was sent.`); resolve(true);
      }, 500) };
    });
  };
  const navigatePreview = (path, options) => {
    if (path === '/checkout') { navigate('/preview/checkout', { state: { previewCart: items } }); return; }
    if (path === '/client-dashboard') { navigate('/preview/client-dashboard'); return; }
    if (path === '/new-order') { navigate('/preview/new-order', { state: { previewCart: items, previewEditItem: options?.state?.itemToEdit } }); return; }
    if (path === '/' || path.includes('#')) { window.location.assign(path); return; }
    setNotice('Preview only: account settings opens after signing in to the connected app. No payment or order was submitted.');
    window.scrollTo({ top: 0 });
  };
  return <CartView user={{ name: 'Alex Morgan' }} items={items} loading={scenario === 'loading'} error={scenario === 'error' ? 'We couldn’t load your cart. Please try again.' : ''} removingId={removingId} actionError={actionError} notice={notice} onRetry={() => reset()} onRemove={remove} onNavigate={navigatePreview} onLogout={() => navigate('/login')} previewControls={
    <div className="cd-preview-bar"><div><strong>Local preview · Sample data</strong><small>Review your cart without signing in or making a payment.</small></div><div className="cd-preview-controls"><label htmlFor="cart-preview-state">Preview state</label><select id="cart-preview-state" value={scenario} onChange={event => reset(event.target.value)}><option value="sample">Sample cart</option><option value="empty">Empty cart</option><option value="loading">Loading</option><option value="error">Loading error</option><option value="remove-error">Removal error</option><option value="unavailable">Unavailable item</option></select><button onClick={() => reset()}>Reset preview</button><Link to="/preview/client-dashboard">Client dashboard</Link><Link to="/login">Back to login</Link></div></div>
  } />;
};
export default CartPreview;
