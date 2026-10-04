import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import DeliveryDetailsView from '../Components/DeliveryDetailsView';
import { deliveryAction, deliveryContext } from '../Components/deliveryDetailsModel';
import { validateProofFile } from '../Components/travelerDashboardModel';
import { previewAvailable, previewDeliveries, previewTraveler } from './travelerDashboardFixtures';

const scenarios = [['sample', 'Selected delivery'], ['available', 'Available'], ['assigned', 'Ready to ship'], ['shipped', 'On the way'], ['waiting', 'Awaiting client'], ['proof', 'Proof needed'], ['complete', 'Completed'], ['cancelled', 'Cancelled'], ['claim-error', 'Accept error'], ['status-error', 'Status error'], ['upload-error', 'Proof error'], ['finish-error', 'Proof saved / status error'], ['missing-details', 'Missing item details'], ['photo-error', 'Unavailable photos'], ['loading', 'Loading'], ['error', 'Loading error'], ['missing', 'Delivery unavailable']];

const DeliveryDetailsPreviewScreen = ({ location }) => {
  const navigate = useNavigate();
  const [available] = useState(() => structuredClone(location.state?.previewProducts || previewAvailable));
  const [claimed] = useState(() => structuredClone(location.state?.previewDeliveries || previewDeliveries));
  const productId = new URLSearchParams(location.search).get('product') || available[0]?._id || previewAvailable[0]._id;
  const [base] = useState(() => deliveryContext(available, claimed, productId));
  const [context, setContext] = useState(() => structuredClone(base));
  const [scenario, setScenario] = useState('sample'), [busy, setBusy] = useState('');
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [revision, setRevision] = useState(0);
  const pending = useRef(null), failure = useRef('');
  useEffect(() => () => clearTimeout(pending.current), []);
  const reset = (next = 'sample') => {
    clearTimeout(pending.current); pending.current = null; failure.current = next;
    setScenario(next); setBusy(''); setError(''); setNotice(''); setRevision(value => value + 1);
    if (next === 'sample') { setContext(structuredClone(base)); return; }
    const product = structuredClone(base?.product || previewAvailable[0]);
    const status = { available: 'Pending', assigned: 'Assigned', shipped: 'Shipped', waiting: 'Traveler Confirmed', proof: 'Client Confirmed', complete: 'Complete', cancelled: 'Cancelled', 'claim-error': 'Pending', 'status-error': 'Assigned', 'upload-error': 'Client Confirmed', 'finish-error': 'Client Confirmed' }[next] || 'Pending';
    Object.assign(product, { deliveryStatus: status, claimedBy: status === 'Pending' ? null : 'preview-traveler', isDelivered: status === 'Complete', proofUploaded: false, clientRating: null });
    if (next === 'missing-details') Object.assign(product, { productName: '', productDescription: '', productPhotos: [], rewardAmount: null, totalPrice: null, quantity: null, productWeight: null, productDimensions: '', urgencyLevel: '', categoryName: '', destination: null, deliverydate: null, orderNumber: '' });
    if (next === 'photo-error') product.productPhotos = ['/sample-missing-delivery-photo.png', '/sample-missing-delivery-photo-2.png'];
    setContext(deliveryContext(status === 'Pending' ? [product] : [], status === 'Pending' ? [] : [product], product._id));
  };
  const patch = changes => setContext(previous => ({ ...previous, owned: true, available: false, product: { ...previous.product, ...changes } }));
  const simulate = (type, work) => {
    if (pending.current) return;
    setBusy(type); setError(''); setNotice('');
    pending.current = setTimeout(() => { pending.current = null; setBusy(''); work(); }, 650);
  };
  const claim = () => {
    if (deliveryAction(context) !== 'claim') return;
    simulate('claim', () => {
      if (failure.current === 'claim-error') { failure.current = ''; setError('Sample acceptance failed. Try again or refresh the details.'); return; }
      patch({ deliveryStatus: 'Assigned', claimedBy: 'preview-traveler' }); setNotice('Sample delivery accepted. No request was sent.');
    });
  };
  const advance = () => {
    const status = { ship: 'Shipped', handover: 'Traveler Confirmed', finish: 'Complete' }[deliveryAction(context)];
    if (!status) return;
    simulate('status', () => {
      if (failure.current === 'status-error') { failure.current = ''; setError('Sample status update failed. Please try again.'); return; }
      patch({ deliveryStatus: status, proofUploaded: false, isDelivered: status === 'Complete' }); setNotice('Sample delivery status updated. No request was sent.');
    });
  };
  const upload = file => {
    if (deliveryAction(context) !== 'proof') return;
    const validation = validateProofFile(file); if (validation) { setError(validation); return; }
    simulate('proof', () => {
      if (failure.current === 'upload-error') { failure.current = ''; setError('Sample proof submission failed. Your file is still selected. Please try again.'); return; }
      if (failure.current === 'finish-error') { failure.current = ''; patch({ proofUploaded: true }); setError('Sample proof saved, but the status update failed. Select Finish delivery to retry.'); return; }
      patch({ deliveryStatus: 'Complete', isDelivered: true }); setNotice('Sample journey complete. Your file was not read, uploaded, or stored.');
    });
  };
  const state = () => {
    const currentId = context?.product._id;
    const replace = items => items.some(item => item._id === currentId) ? items.map(item => item._id === currentId ? context.product : item) : [...items, context.product];
    return { ...location.state, previewUser: location.state?.previewUser || previewTraveler,
      previewProducts: !context ? available : context.owned ? available.filter(item => item._id !== currentId) : replace(available),
      previewDeliveries: context?.owned ? replace(claimed) : claimed,
    };
  };
  const navigatePreview = path => {
    if (pending.current) return;
    const nextState = state();
    if (path.startsWith('/traveler-dashboard')) navigate(path.replace('/traveler-dashboard', '/preview/traveler-dashboard'), { state: nextState });
    else if (path.startsWith('/settings')) navigate('/preview/settings?as=traveler', { state: nextState });
    else if (path.startsWith('/rate-product/')) navigate('/preview/rating?as=traveler', { state: { ...nextState, productId: context.product._id, previewProduct: context.product } });
    else navigate(path);
    window.scrollTo({ top: 0 });
  };
  const phase = ['loading', 'error', 'missing'].includes(scenario) ? scenario : context ? 'ready' : 'missing';
  return <DeliveryDetailsView key={revision} user={location.state?.previewUser || previewTraveler} context={context} phase={phase} busy={busy} error={error} notice={notice} onClaim={claim} onAdvance={advance} onUpload={upload} onRetry={() => {
    if (pending.current) return;
    if (phase !== 'ready') reset(); else { setError(''); setNotice('Sample details refreshed. Use Simulate client receipt to try the next stage.'); }
  }} onNavigate={navigatePreview} onLogout={() => navigate('/login')} previewControls={
    <div className="cd-preview-bar"><div><strong>Local preview · Delivery details</strong><small>Try the journey with sample data. Files and changes stay local.</small></div><div className="cd-preview-controls"><label htmlFor="delivery-preview-state">Preview state</label><select id="delivery-preview-state" value={scenario} onChange={event => reset(event.target.value)}>{scenarios.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button disabled={Boolean(busy) || phase !== 'ready' || deliveryAction(context) !== 'wait'} onClick={() => { patch({ deliveryStatus: 'Client Confirmed' }); setError(''); setNotice('Sample client receipt confirmed. You can now try the proof step.'); }}>Simulate client receipt</button><button onClick={() => reset()}>Reset preview</button><Link to="/preview/traveler-dashboard" state={state()}>Traveler dashboard</Link></div></div>
  } />;
};
DeliveryDetailsPreviewScreen.propTypes = { location: PropTypes.object.isRequired };
const DeliveryDetailsPreview = () => { const location = useLocation(); return <DeliveryDetailsPreviewScreen key={location.key} location={location} />; };
export default DeliveryDetailsPreview;
