import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import OrderDetailsView from '../Components/OrderDetailsView';
import { canConfirmReceipt, confirmOrderItem } from '../Components/orderDetailsModel';
import { previewOrders, previewUser } from './clientDashboardFixtures';
import { enrichPreviewOrder, previewDetailedOrder } from './orderDetailsFixtures';

const OrderDetailsPreview = () => {
  const location = useLocation(), navigate = useNavigate();
  const [base] = useState(() => enrichPreviewOrder(location.state?.previewOrder || previewDetailedOrder));
  const [order, setOrder] = useState(() => structuredClone(base));
  const [scenario, setScenario] = useState('sample'), [notice, setNotice] = useState('');
  const [confirmingId, setConfirmingId] = useState(''), [actionError, setActionError] = useState(null);
  const dashboardOrders = location.state?.previewOrders || previewOrders;
  const updatedOrders = dashboardOrders.some(existing => existing.orderNumber === order.orderNumber)
    ? dashboardOrders.map(existing => existing.orderNumber === order.orderNumber ? order : existing)
    : [{ ...order, _id: order._id || `preview-${order.orderNumber}` }, ...dashboardOrders];
  const pending = useRef(null);
  const cancel = () => { if (pending.current) { clearTimeout(pending.current.timer); pending.current.resolve(false); pending.current = null; } };
  useEffect(() => () => cancel(), []);
  const reset = (next = 'sample') => {
    cancel(); setScenario(next); setNotice(''); setConfirmingId(''); setActionError(null);
    const copy = structuredClone(base);
    if (next === 'cancelled') copy.deliveryStatus = 'Cancelled';
    if (next === 'empty') copy.items = [];
    if (next === 'missing') copy.items = [{ product: null, quantity: null, deliveryStatus: 'Traveler Confirmed', claimedBy: null }];
    const status = { pending: 'Pending', complete: 'Complete', 'confirm-error': 'Traveler Confirmed' }[next];
    if (status) copy.items = copy.items.map(item => ({ ...item, deliveryStatus: status, ...(next === 'pending' ? { claimedBy: null } : {}) }));
    setOrder(copy);
  };
  const confirm = id => {
    if (pending.current || !canConfirmReceipt(order, id)) return Promise.resolve(false);
    setConfirmingId(id); setActionError(null); setNotice('');
    return new Promise(resolve => {
      pending.current = { resolve, timer: setTimeout(() => {
        pending.current = null; setConfirmingId('');
        if (scenario === 'confirm-error') { setActionError({ id, message: 'Sample confirmation failed. Nothing changed. Try confirming again.' }); setScenario('sample'); resolve(false); return; }
        setOrder(previous => confirmOrderItem(previous, id)); setNotice('Sample receipt confirmed. No request was sent.'); resolve(true);
      }, 550) };
    });
  };
  const navigatePreview = path => {
    if (path.startsWith('/rate-product/')) {
      navigate('/preview/rating?as=client', { state: { productId: decodeURIComponent(path.split('?')[0].split('/').at(-1)), previewOrder: order, previewOrders: updatedOrders } }); window.scrollTo({ top: 0 }); return;
    }
    if (path === '/client-dashboard') {
      navigate('/preview/client-dashboard', { state: { previewOrders: updatedOrders } }); window.scrollTo({ top: 0 }); return;
    }
    if (path === '/cart' || path === '/new-order') { navigate(`/preview${path}`); return; }
    if (path === '/' || path.includes('#')) { window.location.assign(path); return; }
    setNotice(`Preview only: ${path.startsWith('/rate-product/') ? 'Traveler ratings' : 'Account settings'} opens after signing in to the connected app. No data was submitted.`);
  };
  return <OrderDetailsView user={previewUser} order={['loading', 'error', 'not-found'].includes(scenario) ? null : order} loading={scenario === 'loading'} error={scenario === 'not-found' ? 'not-found' : ['error', 'refresh-error'].includes(scenario) ? 'load' : ''} notice={notice} confirmingId={confirmingId} actionError={actionError} onRetry={() => reset()} onConfirm={confirm} onNavigate={navigatePreview} onLogout={() => navigate('/login')} previewControls={
    <div className="cd-preview-bar"><div><strong>Local preview · Sample order</strong><small>Follow an order and try receipt confirmation without the backend.</small></div><div className="cd-preview-controls"><label htmlFor="order-details-preview-state">Preview state</label><select id="order-details-preview-state" value={scenario} onChange={event => reset(event.target.value)}><option value="sample">Mixed delivery stages</option><option value="pending">Finding a traveler</option><option value="complete">Completed order</option><option value="cancelled">Cancelled order</option><option value="confirm-error">Confirmation error</option><option value="missing">Missing product details</option><option value="empty">No item details</option><option value="loading">Loading</option><option value="error">Loading error</option><option value="refresh-error">Refresh error</option><option value="not-found">Order not found</option></select><button onClick={() => reset()}>Reset preview</button><Link to="/preview/client-dashboard" state={{ previewOrders: updatedOrders }}>Client dashboard</Link><Link to="/login">Back to login</Link></div></div>
  } />;
};
export default OrderDetailsPreview;
