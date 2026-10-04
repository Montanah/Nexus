import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import RatingView from '../Components/RatingView';
import { clientRatingContext, ratingPayload, travelerRatingContext, validateRating } from '../Components/ratingModel';
import { getProductId } from '../Components/clientDashboardModel';
import { previewOrders } from './clientDashboardFixtures';
import { previewAvailable, previewDeliveries } from './travelerDashboardFixtures';
import { enrichPreviewOrder } from './orderDetailsFixtures';

const RatingPreviewScreen = ({ location }) => {
  const navigate = useNavigate();
  const role = new URLSearchParams(location.search).get('as') === 'traveler' ? 'traveler' : 'client';
  const [baseOrder] = useState(() => enrichPreviewOrder(location.state?.previewOrder || { ...structuredClone(previewOrders[1]), items: previewOrders[1].items.map(item => ({ ...structuredClone(item), deliveryStatus: 'Client Confirmed' })) }));
  const [baseProduct] = useState(() => structuredClone(location.state?.previewProduct || { ...previewDeliveries[3], deliveryStatus: 'Complete', client: { name: 'Alex Morgan' } }));
  const productId = location.state?.productId || (role === 'traveler' ? baseProduct._id : getProductId(baseOrder.items[0]));
  const [order, setOrder] = useState(() => structuredClone(baseOrder)), [product, setProduct] = useState(() => structuredClone(baseProduct));
  const [scenario, setScenario] = useState('sample'), [saving, setSaving] = useState(false), [error, setError] = useState(''), [saved, setSaved] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const pending = useRef(null), failNext = useRef(false);
  useEffect(() => () => clearTimeout(pending.current), []);
  const context = role === 'traveler' ? travelerRatingContext([product], productId) : clientRatingContext([order], productId);
  const phase = saved ? 'saved' : ['loading', 'error', 'missing', 'blocked', 'already'].includes(scenario) ? scenario
    : !context ? 'missing' : context.existingRating != null ? 'already' : context.eligible ? 'ready' : 'blocked';
  const displayContext = ['loading', 'error', 'missing'].includes(phase) ? null : scenario === 'already' ? { ...context, existingRating: 4, existingComment: 'Clear communication and a smooth handover. Thank you!' }
    : scenario === 'blocked' ? { ...context, status: 'Shipped' } : scenario === 'missing-details' ? { ...context, name: 'Product details unavailable', person: `Your ${role === 'traveler' ? 'client' : 'traveler'}`, photo: '', orderNumber: '' } : context;
  const reset = (next = 'sample') => {
    clearTimeout(pending.current); pending.current = null; failNext.current = next === 'submit-error';
    setOrder(structuredClone(baseOrder)); setProduct(structuredClone(baseProduct)); setScenario(next); setSaving(false); setError(''); setSaved(null); setFormKey(value => value + 1);
  };
  const submit = (rating, comment) => {
    if (pending.current || phase !== 'ready' || validateRating(rating, comment)) return;
    setSaving(true); setError('');
    pending.current = setTimeout(() => {
      pending.current = null; setSaving(false);
      if (failNext.current) { failNext.current = false; setError('Sample save failed. Your feedback is still here. Please try again.'); return; }
      const payload = ratingPayload(productId, rating, comment); setSaved(payload);
      if (role === 'traveler') setProduct(previous => ({ ...previous, clientRating: rating, clientComment: payload.comment }));
      else setOrder(previous => ({ ...previous, items: previous.items.map(item => getProductId(item) === productId ? { ...item, travelerRating: rating, travelerComment: payload.comment } : item) }));
    }, 600);
  };
  const dashboardOrders = location.state?.previewOrders || previewOrders;
  const updatedOrders = dashboardOrders.some(existing => existing.orderNumber === order.orderNumber)
    ? dashboardOrders.map(existing => existing.orderNumber === order.orderNumber ? order : existing)
    : [{ ...order, _id: order._id || `preview-${order.orderNumber}` }, ...dashboardOrders];
  const navigatePreview = path => {
    if (pending.current) return;
    if (path.startsWith('/orders/')) navigate('/preview/order-details', { state: { previewOrder: order, previewOrders: updatedOrders } });
    else if (path === '/client-dashboard') navigate('/preview/client-dashboard', { state: { previewOrders: updatedOrders } });
    else if (path === '/traveler-dashboard') navigate('/preview/traveler-dashboard', { state: { previewProducts: location.state?.previewProducts || previewAvailable, previewDeliveries: (location.state?.previewDeliveries || previewDeliveries).map(existing => existing._id === productId ? product : existing) } });
    else navigate(path);
    window.scrollTo({ top: 0 });
  };
  return <RatingView key={formKey} role={role} context={displayContext} phase={phase} saving={saving} error={error} saved={saved} onSubmit={submit} onRetry={() => reset()} onNavigate={navigatePreview} previewControls={
    <div className="cd-preview-bar"><div><strong>Local preview · Sample feedback</strong><small>No rating is sent. Try the stars, comment, and save states.</small></div><div className="cd-preview-controls"><label htmlFor="rating-preview-state">Preview state</label><select id="rating-preview-state" value={scenario} onChange={event => reset(event.target.value)}><option value="sample">Ready to rate</option><option value="submit-error">Save error</option><option value="already">Already rated</option><option value="blocked">Not ready to rate</option><option value="missing-details">Missing display details</option><option value="loading">Loading</option><option value="error">Loading error</option><option value="missing">Delivery not found</option></select><button onClick={() => reset()}>Reset preview</button><Link to={`/preview/rating?as=${role === 'client' ? 'traveler' : 'client'}`}>{role === 'client' ? 'Rate a client' : 'Rate a traveler'}</Link><Link to="/login">Back to login</Link></div></div>
  } />;
};
RatingPreviewScreen.propTypes = { location: PropTypes.object.isRequired };
const RatingPreview = () => { const location = useLocation(); return <RatingPreviewScreen key={location.key} location={location} />; };
export default RatingPreview;
