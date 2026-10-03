import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ClientDashboardView from '../Components/ClientDashboardView';
import { applyDeliveryConfirmation } from '../Components/clientDashboardModel';
import { previewOrders, previewUser } from './clientDashboardFixtures';

const ClientDashboardPreview = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(() => structuredClone(previewOrders));
  const [scenario, setScenario] = useState('ready');
  const [notice, setNotice] = useState('');
  const [confirmingId, setConfirmingId] = useState('');
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const reset = () => {
    clearTimeout(timer.current);
    setOrders(structuredClone(previewOrders));
    setScenario('ready');
    setNotice('');
    setConfirmingId('');
  };
  const navigatePreview = path => {
    if (path === '/cart') { navigate('/preview/cart'); return; }
    if (path === '/new-order') { navigate('/preview/new-order'); return; }
    if (path === '/' || path === '/#how-it-works') { window.location.assign(path); return; }
    const destinations = { '/new-order': 'Creating an order', '/cart': 'Your cart', '/settings': 'Account settings' };
    setNotice(`Preview only: ${destinations[path] || 'Traveler ratings'} opens after signing in to the connected app. No data has been submitted.`);
    window.scrollTo({ top: 0 });
  };
  const confirm = productId => {
    if (confirmingId) return;
    setConfirmingId(productId);
    timer.current = setTimeout(() => {
      setOrders(previous => applyDeliveryConfirmation(previous, productId));
      setConfirmingId('');
      setNotice('Sample receipt confirmed. This updated the preview only; no request was sent.');
    }, 500);
  };

  return <ClientDashboardView user={previewUser} orders={scenario === 'empty' ? [] : orders} loading={scenario === 'loading'} error={scenario === 'error' ? 'We couldn’t load your orders. Please try again.' : ''} notice={notice} confirmingId={confirmingId} onRetry={reset} onNavigate={navigatePreview} onConfirm={confirm} onLogout={() => navigate('/login')} previewControls={
    <div className="cd-preview-bar">
      <div><strong>Local preview · Sample data</strong><small>Explore the Client dashboard without signing in.</small></div>
      <div className="cd-preview-controls"><label htmlFor="client-preview-state">Preview state</label><select id="client-preview-state" value={scenario} onChange={event => { setScenario(event.target.value); setNotice(''); }}><option value="ready">Sample orders</option><option value="empty">Empty account</option><option value="loading">Loading</option><option value="error">Error</option></select><button onClick={reset}>Reset preview</button><Link to="/login">Back to login</Link></div>
    </div>
  } />;
};
export default ClientDashboardPreview;
