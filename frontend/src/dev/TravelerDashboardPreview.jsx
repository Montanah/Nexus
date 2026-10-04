import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import TravelerDashboardView from '../Components/TravelerDashboardView';
import { nextStatus, normalizeProducts } from '../Components/travelerDashboardModel';
import { previewAvailable, previewDeliveries, previewEarnings, previewTraveler } from './travelerDashboardFixtures';

const TravelerDashboardPreview = () => {
  const navigate = useNavigate(), location = useLocation();
  const [products, setProducts] = useState(() => normalizeProducts(location.state?.previewProducts || previewAvailable));
  const [deliveries, setDeliveries] = useState(() => normalizeProducts(location.state?.previewDeliveries || previewDeliveries));
  const [scenario, setScenario] = useState('ready');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(null);
  const simulation = useRef(null);
  const cancelSimulation = () => {
    if (simulation.current) {
      clearTimeout(simulation.current.timer);
      simulation.current.resolve(false);
      simulation.current = null;
    }
  };
  useEffect(() => () => cancelSimulation(), []);
  const reset = () => {
    cancelSimulation(); setBusy(null); setScenario('ready'); setNotice('');
    setProducts(normalizeProducts(previewAvailable)); setDeliveries(normalizeProducts(previewDeliveries));
  };
  const simulate = (id, type, update) => {
    if (simulation.current) return Promise.resolve(false);
    setBusy({ id, type }); setNotice('');
    return new Promise(resolve => {
      simulation.current = { resolve, timer: setTimeout(() => {
        update(); setBusy(null); simulation.current = null; resolve(true);
      }, 500) };
    });
  };
  const claim = id => simulate(id, 'claim', () => {
    const product = products.find(item => item.productId === id);
    setProducts(previous => previous.filter(item => item.productId !== id));
    setDeliveries(previous => [...previous, { ...product, deliveryStatus: 'Assigned', claimedBy: 'preview-traveler' }]);
    setNotice('Sample delivery accepted. This changed the preview only; no request was sent.');
  });
  const advance = id => simulate(id, 'status', () => {
    setDeliveries(previous => previous.map(product => product.productId === id ? { ...product, deliveryStatus: nextStatus(product) || product.deliveryStatus } : product));
    setNotice('Sample delivery status updated. No request was sent.');
  });
  const upload = id => simulate(id, 'proof', () => {
    setDeliveries(previous => previous.map(product => product.productId === id ? { ...product, deliveryStatus: 'Complete' } : product));
    setNotice('Sample proof submission completed. Your file was not uploaded or stored.');
  });
  const navigatePreview = path => {
    if (path.startsWith('/settings')) { navigate('/preview/settings?as=traveler', { state: { previewProducts: products, previewDeliveries: deliveries, previewUser: location.state?.previewUser || previewTraveler } }); window.scrollTo({ top: 0 }); return; }
    if (path.startsWith('/rate-product/')) {
      const productId = decodeURIComponent(path.split('?')[0].split('/').at(-1));
      navigate('/preview/rating?as=traveler', { state: { productId, previewProduct: deliveries.find(product => product.productId === productId), previewDeliveries: deliveries, previewProducts: products } }); window.scrollTo({ top: 0 }); return;
    }
    if (path === '/' || path.includes('#')) { window.location.assign(path); return; }
    setNotice(`Preview only: ${path === '/settings' ? 'Account settings' : 'Client ratings'} opens after signing in to the connected app. No data has been submitted.`);
    window.scrollTo({ top: 0 });
  };
  const states = Object.fromEntries(['products', 'deliveries', 'earnings'].map(key => [key, scenario === 'loading']));
  const errors = scenario === 'error' ? { products: 'We couldn’t load available deliveries. Please try again.', deliveries: 'We couldn’t load your deliveries. Please try again.', earnings: 'Earnings are unavailable.' } : {};

  return <TravelerDashboardView user={location.state?.previewUser || previewTraveler} products={scenario === 'empty' ? [] : products} deliveries={scenario === 'empty' ? [] : deliveries} earnings={scenario === 'empty' ? { totalEarnings: 0, pendingPayments: 0, rating: { average: 0, count: 0 } } : previewEarnings} loading={states} errors={errors} busy={busy} notice={notice} onRetry={reset} onNavigate={navigatePreview} onClaim={claim} onAdvance={advance} onUpload={upload} onLogout={() => navigate('/login')} previewControls={
    <div className="cd-preview-bar"><div><strong>Local preview · Sample data</strong><small>Explore the Traveler dashboard without signing in.</small></div><div className="cd-preview-controls">
      <label htmlFor="traveler-preview-state">Preview state</label><select id="traveler-preview-state" value={scenario} onChange={event => { cancelSimulation(); setBusy(null); setScenario(event.target.value); setNotice(''); }}><option value="ready">Sample deliveries</option><option value="empty">Empty account</option><option value="loading">Loading</option><option value="error">Error</option></select>
      <button disabled={Boolean(busy) || scenario !== 'ready' || !deliveries.some(product => product.deliveryStatus === 'Traveler Confirmed')} onClick={() => {
        setDeliveries(previous => previous.map(product => product.deliveryStatus === 'Traveler Confirmed' ? { ...product, deliveryStatus: 'Client Confirmed' } : product));
        setNotice('Sample client receipt confirmed. You can now try the proof upload step.');
      }}>Simulate client receipt</button><button onClick={reset}>Reset preview</button><Link to="/login">Back to login</Link>
    </div></div>
  } />;
};
export default TravelerDashboardPreview;
