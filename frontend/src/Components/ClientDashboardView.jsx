import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  FiArrowDown, FiArrowRight, FiArrowUpRight, FiCheck, FiCheckCircle, FiChevronRight,
  FiClock, FiCompass, FiGrid, FiLogOut, FiMapPin, FiMenu, FiPackage, FiPlus,
  FiRefreshCw, FiSearch, FiSend, FiSettings, FiShield, FiShoppingBag, FiStar, FiX,
} from 'react-icons/fi';
import Logo from '../assets/NexusLogo.png';
import {
  formatDate, formatMoney, getItems, getItemStatus, getOrderStatus, getProductId,
  matchesOrderFilter, searchOrder, statusLabels,
} from './clientDashboardModel';
import './clientDashboard.css';

const filters = [
  { key: 'all', label: 'All orders', icon: FiPackage },
  { key: 'active', label: 'In progress', icon: FiSend },
  { key: 'confirm', label: 'To confirm', icon: FiCheckCircle },
  { key: 'complete', label: 'Completed', icon: FiShoppingBag },
];

const Status = ({ value }) => <span className={`cd-status cd-status-${value.toLowerCase().replaceAll(' ', '-')}`}><span />{statusLabels[value] || value}</span>;
Status.propTypes = { value: PropTypes.string.isRequired };

const ProductImage = ({ product }) => {
  const [failed, setFailed] = useState(false);
  const src = product?.productPhotos?.[0];
  useEffect(() => { setFailed(false); }, [src]);
  return <span className="cd-product-image">{src && !failed ? <img src={src} alt="" onError={() => setFailed(true)} /> : <FiPackage aria-hidden="true" />}</span>;
};
ProductImage.propTypes = { product: PropTypes.oneOfType([PropTypes.object, PropTypes.string]) };

const ItemProgress = ({ status }) => {
  if (status === 'Cancelled') return null;
  const index = { Pending: 0, Assigned: 1, Shipped: 2, 'Traveler Confirmed': 2, 'Client Confirmed': 3, Complete: 3, Delivered: 3 }[status];
  if (index === undefined) return null;
  return <ol className="cd-progress" aria-label="Delivery progress">{['Placed', 'Matched', 'On the way', 'Received'].map((label, step) => <li key={label} className={step <= index ? 'is-reached' : ''} aria-current={step === index ? 'step' : undefined}><span>{step < index ? <FiCheck aria-hidden="true" /> : step + 1}</span><small>{label}</small></li>)}</ol>;
};
ItemProgress.propTypes = { status: PropTypes.string.isRequired };

const ClientDashboardView = ({ user, orders, loading, error, actionError, notice, confirmingId, logoutLoading, onRetry, onNavigate, onConfirm, onLogout, previewControls }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [selectedId, setSelectedId] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  const menu = useRef(null);
  const detailsHeading = useRef(null);
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';
  const initials = (user?.name || 'Nexus client').split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const counts = Object.fromEntries(filters.map(({ key }) => [key, orders.filter(order => matchesOrderFilter(order, key)).length]));
  const visibleOrders = useMemo(() => orders.filter(order => matchesOrderFilter(order, filter) && searchOrder(order, query)).sort((a, b) => {
    const first = Date.parse(a.createdAt) || 0;
    const second = Date.parse(b.createdAt) || 0;
    return sort === 'newest' ? second - first : first - second;
  }), [orders, query, filter, sort]);
  const selectedOrder = visibleOrders.find(order => order._id === selectedId) || visibleOrders[0];

  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'Your orders | Nexus';
    return () => { document.title = originalTitle; };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    menu.current?.querySelector('button')?.focus();
    const closeOnEscape = event => {
      if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  const navigate = (path, options) => { setMenuOpen(false); onNavigate(path, options); };
  const showOrders = () => {
    setMenuOpen(false);
    document.querySelector('#client-orders')?.scrollIntoView({ block: 'start' });
    document.querySelector('#client-orders-heading')?.focus();
  };
  const selectOrder = id => {
    setSelectedId(id);
    if (window.matchMedia('(max-width: 1180px)').matches) requestAnimationFrame(() => {
      detailsHeading.current?.focus({ preventScroll: true });
      detailsHeading.current?.scrollIntoView({ block: 'start' });
    });
  };

  return (
    <div className="nexus-client-dashboard">
      <a className="cd-skip" href="#client-main">Skip to dashboard</a>
      {previewControls}
      <div className="cd-layout">
        <aside className="cd-sidebar">
          <div className="cd-brand-row">
            <button className="cd-brand" onClick={() => navigate('/')} aria-label="Nexus home"><img src={Logo} alt="" width="44" height="44" /><span>NEXUS<span>.</span></span></button>
            <button className="cd-menu-button" ref={menuButton} onClick={() => setMenuOpen(value => !value)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="client-navigation">{menuOpen ? <FiX /> : <FiMenu />}</button>
          </div>
          <div className={`cd-sidebar-body ${menuOpen ? 'is-open' : ''}`} id="client-navigation" ref={menu}>
            <span className="cd-nav-label">YOUR WORKSPACE</span>
            <nav aria-label="Client navigation">
              <button className="is-current" onClick={() => { setFilter('all'); setQuery(''); showOrders(); }} aria-current="page"><FiGrid aria-hidden="true" />Overview<span className="cd-nav-dot" /></button>
              <button onClick={showOrders}><FiPackage aria-hidden="true" />My orders<span className="cd-nav-count">{loading || error ? '—' : orders.length}</span></button>
              <button onClick={() => navigate('/cart')}><FiShoppingBag aria-hidden="true" />My cart<FiChevronRight className="cd-nav-arrow" aria-hidden="true" /></button>
              <button onClick={() => navigate('/settings', { state: { role: 'client' } })}><FiSettings aria-hidden="true" />Settings</button>
            </nav>
            <div className="cd-sidebar-guide"><span><FiCompass aria-hidden="true" /></span><h2>A little guidance?</h2><p>See how your order becomes someone’s next delivery.</p><button onClick={() => navigate('/#how-it-works')}>How Nexus works <FiArrowUpRight aria-hidden="true" /></button></div>
            <div className="cd-account"><span className="cd-avatar" aria-hidden="true">{initials}</span><div><strong>{user?.name || 'Your account'}</strong><span>Client account</span></div><button onClick={onLogout} disabled={logoutLoading} aria-label={logoutLoading ? 'Logging out' : 'Log out'}>{logoutLoading ? <span className="cd-spinner" /> : <FiLogOut aria-hidden="true" />}</button></div>
          </div>
        </aside>

        <main className="cd-main" id="client-main" tabIndex={-1}>
          <header className="cd-page-header"><div><span className="cd-eyebrow">YOUR DELIVERY SPACE</span><h1>Welcome back, {firstName}<span>.</span></h1><p>Every order, every journey. All in one place.</p></div><button className="cd-button cd-primary" onClick={() => navigate('/new-order')}><FiPlus aria-hidden="true" />Create an order</button></header>
          <section className="cd-welcome" aria-label="Start a delivery">
            <div><span className="cd-eyebrow">A SMALLER WORLD. A BETTER WAY TO DELIVER.</span><h2>Good things are<br /><span>on their way.</span></h2><p>Find what you need. Connect with a traveler.<br className="cd-desktop-break" /> Let Nexus bring it a little closer.</p><button className="cd-text-link" onClick={() => navigate('/new-order')}>Start your next order <FiArrowUpRight aria-hidden="true" /></button></div>
            <div className="cd-route-art" aria-hidden="true"><div className="cd-route-orbit" /><div className="cd-route-orbit cd-route-orbit-two" /><span className="cd-route-label cd-route-from"><FiPackage />Your order</span><span className="cd-route-plane"><FiSend /></span><span className="cd-route-label cd-route-to"><FiMapPin />Your doorstep</span><span className="cd-route-caption">CONNECTED BY PEOPLE.</span></div>
          </section>

          <section className="cd-stats" aria-label="Order summary">{filters.map(({ key, label, icon: Icon }) => <button key={key} className={`cd-stat ${filter === key ? 'is-active' : ''}`} onClick={() => { setFilter(key); setQuery(''); }} aria-pressed={filter === key}><span className={`cd-stat-icon cd-stat-${key}`}><Icon aria-hidden="true" /></span><span><small>{label}</small><strong>{loading || error ? '—' : String(counts[key]).padStart(2, '0')}</strong></span><FiArrowUpRight className="cd-stat-arrow" aria-hidden="true" /></button>)}</section>

          {actionError && <p className="cd-error" role="alert">{actionError}</p>}
          {notice && <p className="cd-notice" role="status">{notice}</p>}
          <div className="cd-content-grid">
            <section className="cd-orders cd-surface" id="client-orders" aria-labelledby="client-orders-heading">
              <div className="cd-section-heading"><div><h2 id="client-orders-heading" tabIndex={-1}>Your orders</h2><p>A little closer with every journey.</p></div><button className="cd-icon-button" onClick={onRetry} disabled={loading} aria-label="Refresh orders"><FiRefreshCw aria-hidden="true" /></button></div>
              <div className="cd-order-tools"><label className="cd-search"><FiSearch aria-hidden="true" /><span className="cd-sr-only">Search orders</span><input type="search" placeholder="Search product or order number" value={query} onChange={event => setQuery(event.target.value)} /></label><label className="cd-sort"><span className="cd-sr-only">Sort orders</span><FiArrowDown aria-hidden="true" /><select value={sort} onChange={event => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></div>
              <div className="cd-filters" role="group" aria-label="Filter orders">{filters.map(({ key, label }) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}{!loading && !error && <span>{counts[key]}</span>}</button>)}</div>
              {loading ? <div className="cd-empty" role="status"><span className="cd-spinner" /><h3>Finding your orders…</h3><p>Your delivery details will appear here.</p></div> : error ? <div className="cd-empty"><span className="cd-empty-icon"><FiRefreshCw aria-hidden="true" /></span><h3>Let’s try that again.</h3><p role="alert">{error}</p><button className="cd-button cd-secondary" onClick={onRetry}>Try again <FiRefreshCw aria-hidden="true" /></button></div> : !visibleOrders.length ? <div className="cd-empty"><span className="cd-empty-icon"><FiPackage aria-hidden="true" /></span><h3>{orders.length ? 'No orders match just yet.' : 'Your first connection starts here.'}</h3><p>{orders.length ? 'Try another search or view all your orders.' : 'Tell us what you need and a traveler can help bring it home.'}</p><button className="cd-button cd-primary" onClick={orders.length ? () => { setQuery(''); setFilter('all'); } : () => navigate('/new-order')}>{orders.length ? 'Show all orders' : 'Create your first order'}<FiArrowUpRight aria-hidden="true" /></button></div> : <>
                <ul className="cd-order-list">{visibleOrders.map(order => {
                  const items = getItems(order);
                  const product = items[0]?.product;
                  const status = getOrderStatus(order);
                  return <li key={order._id}><button className={`cd-order-row ${selectedOrder?._id === order._id ? 'is-selected' : ''}`} onClick={() => selectOrder(order._id)} aria-pressed={selectedOrder?._id === order._id} aria-label={`View order ${order.orderNumber || order._id}: ${product?.productName || 'Product details unavailable'}`}><ProductImage product={product} /><span className="cd-order-name"><small>{order.orderNumber || 'Order'}</small><strong>{product?.productName || 'Product details unavailable'}{items.length > 1 && <span> +{items.length - 1}</span>}</strong><span>{formatDate(order.createdAt, 'Date unavailable')} · {items.length} {items.length === 1 ? 'product' : 'products'}</span></span><span className="cd-order-meta"><strong>{formatMoney(order.totalAmount)}</strong><Status value={status} /></span><FiChevronRight className="cd-order-chevron" aria-hidden="true" /></button></li>;
                })}</ul><p className="cd-results" role="status">Showing {visibleOrders.length} of {orders.length} orders</p>
              </>}
            </section>

            <aside className="cd-details cd-surface" aria-labelledby="delivery-details-heading">
              <div className="cd-section-heading"><div><span className="cd-eyebrow">THE JOURNEY, AT A GLANCE</span><h2 id="delivery-details-heading" ref={detailsHeading} tabIndex={-1}>Delivery details</h2></div><FiSend className="cd-details-icon" aria-hidden="true" /></div>
              {loading || error || !selectedOrder ? <div className="cd-details-placeholder"><FiMapPin aria-hidden="true" /><h3>{loading ? 'Getting things ready.' : 'Every journey has a story.'}</h3><p>{loading ? 'Your order details are loading.' : 'Select an order to see its progress and traveler details.'}</p></div> : <>
                <div className="cd-detail-order"><strong>{selectedOrder.orderNumber || 'Your order'}</strong><span>{formatDate(selectedOrder.createdAt, 'Date unavailable')}</span></div>
                <dl className="cd-order-facts"><div><dt>Order total</dt><dd>{formatMoney(selectedOrder.totalAmount)}</dd></div><div><dt>Payment</dt><dd className={selectedOrder.paymentStatus === 'Paid' ? 'cd-paid' : ''}>{selectedOrder.paymentStatus === 'Paid' && <FiCheckCircle aria-hidden="true" />}{selectedOrder.paymentStatus || 'Pending'}</dd></div></dl>
                {getItems(selectedOrder).map((item, index) => {
                  const productId = getProductId(item);
                  const status = getItemStatus(item);
                  const traveler = item.claimedBy?.userId?.name;
                  const canRate = ['Client Confirmed', 'Delivered'].includes(status) && productId && item.claimedBy && item.travelerRating == null;
                  return <section className="cd-item-detail" key={productId || index} aria-label={item.product?.productName || `Product ${index + 1}`}>
                    <div className="cd-detail-product"><ProductImage product={item.product} /><div><h3>{item.product?.productName || 'Product details unavailable'}</h3><p>Quantity: {item.quantity ?? '—'} · {formatMoney(item.product?.totalPrice)} each</p></div></div>
                    <Status value={status} /><ItemProgress status={status} />
                    <div className="cd-traveler"><span className="cd-avatar cd-traveler-avatar" aria-hidden="true">{traveler ? traveler.split(/\s+/).slice(0, 2).map(part => part[0]).join('') : <FiCompass />}</span><div><small>Your traveler</small><strong>{traveler || 'Not assigned yet'}</strong></div></div>
                    <div className="cd-delivery-date"><FiClock aria-hidden="true" /><span>Expected arrival<strong>{formatDate(item.product?.deliverydate)}</strong></span></div>
                    {selectedOrder.deliveryStatus !== 'Cancelled' && status === 'Traveler Confirmed' && productId && <div className="cd-confirm-box"><p>Your traveler has marked this item as delivered. Confirm once you’ve received it.</p><button className="cd-button cd-primary" onClick={() => onConfirm(productId)} disabled={Boolean(confirmingId)}>{confirmingId === productId ? <><span className="cd-spinner" />Confirming…</> : <><FiCheckCircle aria-hidden="true" />I’ve received this item</>}</button></div>}
                    {status === 'Client Confirmed' && <p className="cd-item-note"><FiCheckCircle aria-hidden="true" />Receipt confirmed. Awaiting traveler proof.</p>}
                    {item.travelerRating != null ? <p className="cd-item-note"><FiStar aria-hidden="true" />Your traveler rating: {item.travelerRating}/5</p> : canRate ? <button className="cd-rating-link" onClick={() => navigate(`/rate-product/${productId}`, { state: { isTraveler: false } })}><FiStar aria-hidden="true" />Rate your traveler<FiArrowRight aria-hidden="true" /></button> : null}
                  </section>;
                })}
                {!getItems(selectedOrder).length && <p className="cd-item-note">No product details are available for this order.</p>}
                {selectedOrder.orderNumber && <button className="cd-button cd-secondary cd-order-details-link" onClick={() => navigate(`/orders/${encodeURIComponent(selectedOrder.orderNumber)}`)}>View full order <FiArrowRight aria-hidden="true" /></button>}
              </>}
              <div className="cd-details-footer"><FiShield aria-hidden="true" /><span>Keep your delivery details together,<br />from order to arrival.</span></div>
            </aside>
          </div>
          <footer className="cd-footer"><span>© {new Date().getFullYear()} Nexus</span><span>Good things travel together.</span></footer>
        </main>
      </div>
    </div>
  );
};

ClientDashboardView.propTypes = {
  user: PropTypes.object, orders: PropTypes.arrayOf(PropTypes.object).isRequired, loading: PropTypes.bool,
  error: PropTypes.string, actionError: PropTypes.string, notice: PropTypes.string, confirmingId: PropTypes.string,
  logoutLoading: PropTypes.bool, onRetry: PropTypes.func.isRequired, onNavigate: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired, onLogout: PropTypes.func.isRequired, previewControls: PropTypes.node,
};
export default ClientDashboardView;
