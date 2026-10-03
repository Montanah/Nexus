import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PaymentResultView from '../Components/PaymentResultView';
import { cartTotals, normalizeCart } from '../Components/cartModel';
import { previewCartItems } from './cartFixtures';

const PaymentResultPreview = ({ initialStatus }) => {
  const location = useLocation(), navigate = useNavigate();
  const items = normalizeCart(location.state?.previewCart || previewCartItems);
  const [scenario, setScenario] = useState(initialStatus);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const reset = next => { clearTimeout(timer.current); setScenario(next); };
  const verify = () => { reset('loading'); timer.current = setTimeout(() => setScenario('success'), 650); };
  const hasDetails = ['success', 'failed', 'pending', 'details-error'].includes(scenario);
  const payment = { status: scenario === 'details-error' ? 'success' : scenario, ...(hasDetails ? { amount: cartTotals(items).total, orderNumber: 'SAMPLE-ORDER-1026-24', reference: 'sample-payment-reference', method: 'Paystack' } : {}) };
  const order = hasDetails && scenario !== 'details-error' ? { createdAt: '2026-10-03T12:00:00Z', items: items.map(item => ({ id: item.rowId, name: item.productName, quantity: item.quantity })) } : undefined;
  const navigatePreview = path => {
    if (path.startsWith('/orders/')) {
      const previewOrder = { orderNumber: payment.orderNumber, createdAt: order?.createdAt, totalAmount: payment.amount, paymentStatus: 'Paid', paymentMethod: payment.method, deliveryStatus: 'Pending', items: items.map(item => ({ quantity: item.quantity, deliveryStatus: 'Pending', claimedBy: null, product: { _id: item.productId, productName: item.productName, productPhotos: item.productPhotos, totalPrice: item.productFee * 1.15, categoryName: item.category, productDescription: item.previewForm?.productDescription, destination: { city: item.previewForm?.city, country: item.previewForm?.country }, deliverydate: item.previewForm?.deliveryDate } })) };
      navigate('/preview/order-details', { state: { previewOrder } }); return;
    }
    if (['/client-dashboard', '/cart', '/checkout', '/new-order'].includes(path)) { navigate(`/preview${path}`, { state: { previewCart: items } }); return; }
    navigate(path);
  };
  return <PaymentResultView payment={payment} order={order} detailsError={scenario === 'details-error'} onVerify={verify} onRetryDetails={() => reset('success')} onNavigate={navigatePreview} previewControls={
    <div className="cd-preview-bar"><div><strong>Local preview · Sample outcome</strong><small>No payment was taken. These are sample confirmation and recovery screens.</small></div><div className="cd-preview-controls"><label htmlFor="payment-result-preview-state">Preview state</label><select id="payment-result-preview-state" value={scenario} onChange={event => reset(event.target.value)}><option value="success">Confirmed payment</option><option value="failed">Failed payment</option><option value="pending">Pending payment</option><option value="loading">Verifying payment</option><option value="error">Verification error</option><option value="unconfirmed">Missing details</option><option value="details-error">Item details error</option><option value="auth">Sign-in required</option></select><button onClick={() => reset(initialStatus)}>Reset preview</button><Link to="/preview/checkout" state={{ previewCart: items }}>Checkout preview</Link><Link to="/login">Back to login</Link></div></div>
  } />;
};
PaymentResultPreview.propTypes = { initialStatus: PropTypes.oneOf(['success', 'failed']).isRequired };
export default PaymentResultPreview;
