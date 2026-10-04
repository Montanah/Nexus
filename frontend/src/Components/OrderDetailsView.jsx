import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FiArrowLeft, FiArrowRight, FiArrowUpRight, FiCalendar, FiCheck, FiCheckCircle, FiClock, FiCompass, FiCopy, FiCreditCard, FiGrid, FiLogOut, FiMapPin, FiMenu, FiPackage, FiPlus, FiRefreshCw, FiSend, FiSettings, FiShield, FiShoppingBag, FiStar, FiX } from 'react-icons/fi';
import Logo from '../assets/NexusLogo.png';
import { formatDate, formatMoney, getItems, getOrderStatus, statusLabels } from './clientDashboardModel';
import { deliverySteps, orderItemDetails } from './orderDetailsModel';
import './clientDashboard.css';
import './newOrder.css';
import './orderDetails.css';

const Status = ({ value }) => <span className={`od-status ${value === 'Cancelled' ? 'is-cancelled' : value === 'Traveler Confirmed' ? 'is-action' : ''}`}><span />{statusLabels[value] || 'Status unavailable'}</span>;
Status.propTypes = { value: PropTypes.string };

const OrderItem = ({ item, order, index, busy, confirmingId, actionError, onConfirm, onNavigate }) => {
  const details = orderItemDetails(item, order);
  const heading = useRef(null);
  const [imageFailed, setImageFailed] = useState(false);
  const photo = details.photos[0];
  useEffect(() => { setImageFailed(false); }, [photo]);
  const confirm = async () => { if (await onConfirm(details.id)) heading.current?.focus({ preventScroll: true }); };
  return <article className="od-item cd-surface" aria-label={details.name}>
    <div className="od-item-heading"><span className="od-item-number">ITEM {String(index + 1).padStart(2, '0')}</span><Status value={details.status} /></div>
    <div className="od-product"><div className="od-product-image">{photo && !imageFailed ? <img src={photo} alt="" onError={() => setImageFailed(true)} /> : <FiPackage aria-hidden="true" />}</div><div><span className="cd-eyebrow">{details.category}</span><h3 ref={heading} tabIndex={-1}>{details.name}</h3><div className="od-product-facts"><span>Quantity <strong>{details.quantity ?? '—'}</strong></span><span>{formatMoney(details.unitTotal)} per item</span></div></div></div>
    {details.step >= 0 ? <ol className="od-progress" aria-label={`Delivery progress for ${details.name}`}>{deliverySteps.map((label, step) => <li className={step < details.step ? 'is-done' : step === details.step ? 'is-current' : ''} aria-current={step === details.step ? 'step' : undefined} key={label}><span aria-hidden="true">{step < details.step ? <FiCheck /> : String(step + 1).padStart(2, '0')}</span><strong>{label}</strong><span className="cd-sr-only">{step < details.step ? 'Completed' : step === details.step ? 'Current stage' : 'Upcoming'}</span></li>)}</ol> : <p className="od-progress-note">{details.status === 'Cancelled' ? 'This item is cancelled. Delivery actions are unavailable.' : 'Delivery progress will appear when a status update is available.'}</p>}
    <div className="od-delivery-facts"><div><FiMapPin aria-hidden="true" /><span>Delivering to<strong>{details.destination}</strong></span></div><div><FiCalendar aria-hidden="true" /><span>Requested arrival<strong>{formatDate(details.arrival, 'Not available')}</strong></span></div></div>
    <div className="od-traveler"><span className="cd-avatar" aria-hidden="true">{details.travelerNamed ? details.traveler.split(/\s+/).slice(0, 2).map(part => part[0]).join('') : <FiCompass />}</span><div><small>Your traveler</small><strong>{details.traveler}</strong></div><FiSend className="od-traveler-icon" aria-hidden="true" /></div>
    <details className="od-product-details"><summary>Product and delivery notes<span aria-hidden="true">+</span></summary><p>{details.description || 'A product description is not available for this item.'}</p>{(details.weight !== null || details.dimensions) && <dl>{details.weight !== null && <div><dt>Weight</dt><dd>{details.weight}</dd></div>}{details.dimensions && <div><dt>Dimensions</dt><dd>{details.dimensions}</dd></div>}</dl>}{details.notes && <div className="od-shipping-note"><strong>Shipping notes</strong><p>{details.notes}</p></div>}</details>
    {details.canConfirm && <div className="od-confirm"><div><span><FiPackage aria-hidden="true" /></span><h4>Has this item arrived?</h4><p>Your traveler has marked it ready for confirmation. Confirm only after you’ve received this item.</p></div><button className="cd-button cd-primary" disabled={busy} onClick={confirm} aria-label={`Confirm receipt of ${details.name}`}>{confirmingId === details.id ? <><span className="cd-spinner" />Confirming…</> : <><FiCheckCircle aria-hidden="true" />I’ve received this item</>}</button></div>}
    {details.status === 'Client Confirmed' && <p className="od-confirmed-note"><FiCheckCircle aria-hidden="true" />Receipt confirmed. Your traveler still needs to finish the delivery proof.</p>}
    {actionError?.id === details.id && <p className="od-action-error" role="alert">{actionError.message}</p>}
    {details.rating !== null ? <p className="od-rating"><FiStar aria-hidden="true" />Your traveler rating: {details.rating}/5</p> : details.canRate ? <button className="od-rating-link" disabled={busy} onClick={() => onNavigate(`/rate-product/${encodeURIComponent(details.id)}?as=client`, { state: { isTraveler: false } })}><FiStar aria-hidden="true" />Rate your traveler<FiArrowUpRight aria-hidden="true" /></button> : null}
  </article>;
};
OrderItem.propTypes = { item: PropTypes.object.isRequired, order: PropTypes.object.isRequired, index: PropTypes.number.isRequired, busy: PropTypes.bool, confirmingId: PropTypes.string, actionError: PropTypes.object, onConfirm: PropTypes.func.isRequired, onNavigate: PropTypes.func.isRequired };

const OrderDetailsView = ({ user, order, loading, error, confirmingId, actionError, notice, logoutLoading, onRetry, onConfirm, onNavigate, onLogout, previewControls }) => {
  const [menuOpen, setMenuOpen] = useState(false), [copyNotice, setCopyNotice] = useState('');
  const menu = useRef(null), menuButton = useRef(null);
  const name = user?.name || 'Your account', items = getItems(order), status = order ? getOrderStatus(order) : '';
  const busy = Boolean(confirmingId) || loading;
  const waiting = items.filter(item => orderItemDetails(item, order).canConfirm).length;
  useEffect(() => { const title = document.title; document.title = 'Order details | Nexus'; return () => { document.title = title; }; }, []);
  useEffect(() => {
    if (!menuOpen) return;
    menu.current?.querySelector('button')?.focus();
    const escape = event => { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); } };
    window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape);
  }, [menuOpen]);
  const navigate = (path, options) => { setMenuOpen(false); onNavigate(path, options); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(order.orderNumber); setCopyNotice('Order reference copied.'); }
    catch { setCopyNotice('Couldn’t copy automatically. Select the reference to copy it.'); }
  };
  return <div className="nexus-client-dashboard nexus-order-details">
    <a className="cd-skip" href="#order-details-main">Skip to order details</a>{previewControls}
    <div className="cd-layout">
      <aside className="cd-sidebar">
        <div className="cd-brand-row"><button className="cd-brand" onClick={() => navigate('/')} aria-label="Nexus home"><img src={Logo} alt="" width="44" height="44" /><span>NEXUS<span>.</span></span></button><button className="cd-menu-button" ref={menuButton} onClick={() => setMenuOpen(value => !value)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="order-details-navigation">{menuOpen ? <FiX /> : <FiMenu />}</button></div>
        <div className={`cd-sidebar-body ${menuOpen ? 'is-open' : ''}`} id="order-details-navigation" ref={menu}><span className="cd-nav-label">YOUR WORKSPACE</span>
          <nav aria-label="Client navigation"><button className="is-current" onClick={() => navigate('/client-dashboard')}><FiGrid aria-hidden="true" />Overview</button><button onClick={() => navigate('/new-order')}><FiPlus aria-hidden="true" />Create an order</button><button onClick={() => navigate('/cart')}><FiShoppingBag aria-hidden="true" />My cart</button><button onClick={() => navigate('/settings?as=client', { state: { role: 'client' } })}><FiSettings aria-hidden="true" />Settings</button></nav>
          <div className="cd-sidebar-guide"><span><FiCompass aria-hidden="true" /></span><h2>A place for every update.</h2><p>Your product, traveler, and delivery details, together in one place.</p><button onClick={() => navigate('/#how-it-works')}>How Nexus works <FiArrowUpRight aria-hidden="true" /></button></div>
          <div className="cd-account"><span className="cd-avatar" aria-hidden="true">{name.split(/\s+/).slice(0, 2).map(part => part[0]).join('')}</span><div><strong>{name}</strong><span>Client account</span></div><button onClick={onLogout} disabled={logoutLoading || Boolean(confirmingId)} aria-label={logoutLoading ? 'Logging out' : 'Log out'}>{logoutLoading ? <span className="cd-spinner" /> : <FiLogOut aria-hidden="true" />}</button></div>
        </div>
      </aside>
      <main className="cd-main" id="order-details-main" tabIndex={-1}>
        <div className="no-breadcrumb"><button onClick={() => navigate('/client-dashboard')}><FiArrowLeft aria-hidden="true" />Your dashboard</button><span>/</span><span>Order details</span></div>
        <header className="cd-page-header"><div><span className="cd-eyebrow">FROM A GOOD FIND TO YOUR DOOR</span><h1>Every step, a little closer<span>.</span></h1><p>Follow each item’s journey and keep the details close.</p></div><button className="cd-button cd-secondary" onClick={onRetry} disabled={busy}><FiRefreshCw aria-hidden="true" />{loading && order ? 'Refreshing…' : 'Refresh order'}</button></header>
        {notice && <p className="cd-notice" role="status">{notice}</p>}
        {!order ? <section className="cd-surface cd-empty od-page-state">{loading ? <><span className="cd-spinner" /><h2>Finding your order’s story…</h2><p role="status">Your details will be ready in a moment.</p></> : <><span className="cd-empty-icon"><FiPackage aria-hidden="true" /></span><h2>{error === 'not-found' ? 'We couldn’t find this order.' : 'Let’s try that again.'}</h2><p role="alert">{error === 'not-found' ? 'Return to your dashboard to choose an order from your account.' : 'We couldn’t load your order details. Please try again.'}</p><div><button className="cd-button cd-primary" onClick={onRetry}>Try again <FiRefreshCw aria-hidden="true" /></button><button className="cd-button cd-secondary" onClick={() => navigate('/client-dashboard')}>Back to your dashboard <FiArrowLeft aria-hidden="true" /></button></div></>}</section> : <>
          {error && <p className="cd-error" role="alert">We couldn’t refresh this order. These are the last details loaded. Try refreshing again.</p>}
          <section className="od-overview" aria-labelledby="order-overview-heading"><div><div className="od-reference"><span>{order.orderNumber}</span><button onClick={copy} aria-label="Copy order reference"><FiCopy aria-hidden="true" /></button></div><h2 id="order-overview-heading">{statusLabels[status] || 'Your order, at a glance'}<span>.</span></h2><p>{status === 'Cancelled' ? 'This order is cancelled. You can still review its details below.' : waiting ? `${waiting} ${waiting === 1 ? 'item is' : 'items are'} waiting for your receipt confirmation.` : 'Each item has its own progress. Find the latest updates below.'}</p>{copyNotice && <p className="od-copy-notice" role="status">{copyNotice}</p>}</div><div className="od-route-art" aria-hidden="true"><span className="od-route-orbit" /><span className="od-route-plane"><FiSend /></span><span className="od-route-tag"><FiPackage />A little closer.</span></div></section>
          <div className="od-stats"><div><FiCalendar aria-hidden="true" /><span>Order placed<strong>{formatDate(order.createdAt, 'Not available')}</strong></span></div><div><FiPackage aria-hidden="true" /><span>In this order<strong>{items.length} {items.length === 1 ? 'product' : 'products'}</strong></span></div><div><FiCreditCard aria-hidden="true" /><span>Order total<strong>{formatMoney(order.totalAmount)}</strong></span></div></div>
          <div className="od-grid"><section aria-labelledby="order-items-heading"><div className="od-section-heading"><h2 id="order-items-heading">Inside your order<span>.</span></h2><span>{items.length} {items.length === 1 ? 'product' : 'products'}</span></div>{items.length ? <div className="od-item-list">{items.map((item, index) => <OrderItem key={item._id || `${item.product?._id || item.product || 'missing'}-${index}`} item={item} index={index} order={order} busy={busy || Boolean(error)} confirmingId={confirmingId} actionError={actionError} onConfirm={onConfirm} onNavigate={navigate} />)}</div> : <div className="cd-surface cd-empty"><FiPackage aria-hidden="true" /><h3>No item details available.</h3><p>Refresh this order to check for updates.</p></div>}</section>
            <aside className="od-summary-column"><section className="od-summary cd-surface" aria-labelledby="order-summary-heading"><div className="od-summary-heading"><span className="cd-eyebrow">THE DETAILS, TOGETHER</span><h2 id="order-summary-heading">Your order summary.</h2><FiShoppingBag aria-hidden="true" /></div><div className="od-summary-body"><dl><div><dt>Order reference</dt><dd>{order.orderNumber}</dd></div><div><dt>Payment method</dt><dd>{{ Mpesa: 'M-Pesa', Airtel: 'Airtel Money', Stripe: 'Card', Paystack: 'Paystack' }[order.paymentMethod] || 'Not available'}</dd></div><div><dt>Payment status</dt><dd>{order.paymentStatus || 'Not available'}</dd></div><div className="od-summary-total"><dt>Order total</dt><dd>{formatMoney(order.totalAmount)}</dd></div></dl><p>The total recorded for this order, including applicable fees.</p></div></section>
              <section className="od-help" aria-labelledby="order-help-heading"><span><FiShield aria-hidden="true" /></span><h2 id="order-help-heading">A quick check, a smoother handover.</h2><p>Confirm receipt once each item is in your hands. Your traveler can then finish the delivery proof.</p><div><FiClock aria-hidden="true" /><span>Requested arrival dates are shown for each item.</span></div></section>
              <button className="od-back" onClick={() => navigate('/client-dashboard')}><FiArrowLeft aria-hidden="true" />Back to all your orders<FiArrowRight aria-hidden="true" /></button>
            </aside>
          </div>
        </>}
        <footer className="cd-footer"><span>© {new Date().getFullYear()} Nexus</span><span>Good things travel together.</span></footer>
      </main>
    </div>
  </div>;
};
OrderDetailsView.propTypes = { user: PropTypes.object, order: PropTypes.object, loading: PropTypes.bool, error: PropTypes.string, confirmingId: PropTypes.string, actionError: PropTypes.object, notice: PropTypes.string, logoutLoading: PropTypes.bool, onRetry: PropTypes.func.isRequired, onConfirm: PropTypes.func.isRequired, onNavigate: PropTypes.func.isRequired, onLogout: PropTypes.func.isRequired, previewControls: PropTypes.node };
export default OrderDetailsView;
