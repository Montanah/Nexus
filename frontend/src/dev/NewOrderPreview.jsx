import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NewOrderView from '../Components/NewOrderView';
import { emptyOrderForm, estimateOrder, localDate } from '../Components/newOrderModel';

const categories = [
  { _id: 'preview-category-electronics', categoryName: 'Electronics' },
  { _id: 'preview-category-fashion', categoryName: 'Fashion' },
  { _id: 'preview-category-home', categoryName: 'Home essentials' },
  { _id: 'preview-category-books', categoryName: 'Books' },
];
const arrival = new Date();
arrival.setDate(arrival.getDate() + 7);
const sampleForm = {
  ...emptyOrderForm, productName: 'Wireless headphones', quantity: '2',
  productDescription: 'Sony WH-1000XM5 headphones in black. Please keep both pairs in their original, sealed packaging.',
  productCategory: 'preview-category-electronics', country: 'KE', state: '30', city: 'Nairobi',
  deliveryDate: localDate(arrival), productPrice: '14950', weight: '0.5', dimensions: '25 × 20 × 8 cm',
};
const sampleCart = [{ productId: 'preview-cart-backpack', productName: 'Travel backpack', quantity: 1, finalCharge: 7820 }];

const NewOrderPreview = () => {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState('sample');
  const [revision, setRevision] = useState(0);
  const [cart, setCart] = useState(sampleCart);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const simulation = useRef(null);
  const cancel = () => {
    if (simulation.current) { clearTimeout(simulation.current.timer); simulation.current.resolve({ ok: false }); simulation.current = null; }
  };
  useEffect(() => () => cancel(), []);
  const reset = (next = 'sample') => {
    cancel(); setScenario(next); setRevision(value => value + 1); setCart(next === 'empty' ? [] : sampleCart); setSubmitting(false); setNotice('');
  };
  const save = form => {
    setSubmitting(true); setNotice('');
    return new Promise(resolve => {
      simulation.current = { resolve, timer: setTimeout(() => {
        simulation.current = null; setSubmitting(false);
        if (scenario === 'save-error') { resolve({ ok: false, message: 'Sample save failed. Your details are still here. Choose Sample item to reset the simulation.' }); return; }
        setCart(previous => [...previous, { productId: `preview-cart-${Date.now()}`, productName: form.productName, quantity: Number(form.quantity), finalCharge: estimateOrder(form.productPrice, form.quantity).total }]);
        setNotice('Preview only: your sample item was saved locally in this page. No order, photo, or payment was submitted.');
        resolve({ ok: true });
      }, 500) };
    });
  };
  const navigatePreview = path => {
    if (path === '/client-dashboard') { navigate('/preview/client-dashboard'); return; }
    if (path === '/' || path.includes('#')) { window.location.assign(path); return; }
    setNotice(`Preview only: ${path === '/cart' ? 'Your cart' : 'Account settings'} opens after signing in to the connected app. No data has been submitted.`);
    window.scrollTo({ top: 0 });
  };
  return <NewOrderView key={revision} user={{ name: 'Alex Morgan' }} categories={scenario === 'error' || scenario === 'loading' ? [] : categories} categoryLoading={scenario === 'loading'} categoryError={scenario === 'error' ? 'We couldn’t load your categories.' : ''} cart={cart} cartLoading={scenario === 'loading'} cartError={scenario === 'error' ? 'We couldn’t load your cart.' : ''} initialForm={scenario === 'empty' ? emptyOrderForm : sampleForm} editing={scenario === 'edit'} submitting={submitting} onSave={save} onRetry={() => reset()} onNavigate={navigatePreview} onLogout={() => navigate('/login')} notice={notice} previewControls={
    <div className="cd-preview-bar"><div><strong>Local preview · Sample data</strong><small>Try creating an order without signing in or submitting anything.</small></div><div className="cd-preview-controls"><label htmlFor="order-preview-state">Preview state</label><select id="order-preview-state" value={scenario} onChange={event => reset(event.target.value)}><option value="sample">Sample item</option><option value="empty">Empty form</option><option value="loading">Loading</option><option value="error">Loading error</option><option value="save-error">Save error</option><option value="edit">Edit existing item</option></select><button onClick={() => reset()}>Reset preview</button><Link to="/preview/client-dashboard">Client dashboard</Link><Link to="/login">Back to login</Link></div></div>
  } />;
};
export default NewOrderPreview;
