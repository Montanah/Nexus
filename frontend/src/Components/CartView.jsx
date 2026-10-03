import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FiArrowLeft, FiArrowRight, FiArrowUpRight, FiCheck, FiCheckCircle, FiCompass, FiEdit2, FiGrid, FiLogOut, FiMenu, FiPackage, FiPlus, FiRefreshCw, FiSend, FiSettings, FiShield, FiShoppingBag, FiTrash2, FiX } from 'react-icons/fi';
import Logo from '../assets/NexusLogo.png';
import { formatMoney } from './clientDashboardModel';
import { cartTotals, isCartItemValid } from './cartModel';
import './clientDashboard.css';
import './newOrder.css';
import './cart.css';

const CartImage = ({ item }) => {
  const [failed, setFailed] = useState(false);
  const src = item.productPhotos[0];
  useEffect(() => { setFailed(false); }, [src]);
  return <div className="nc-product-image">{src && !failed ? <img src={src} alt="" onError={() => setFailed(true)} /> : <FiPackage aria-hidden="true" />}</div>;
};
CartImage.propTypes = { item: PropTypes.object.isRequired };

const CartView = ({ user, items, loading, error, removingId, actionError, notice, logoutLoading, onRetry, onRemove, onNavigate, onLogout, previewControls }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menu = useRef(null);
  const menuButton = useRef(null);
  const listHeading = useRef(null);
  const totals = cartTotals(items);
  const busy = Boolean(removingId);
  const unavailable = items.some(item => !isCartItemValid(item));
  const showTotals = !loading && !error;
  const name = user?.name || 'Your account';

  useEffect(() => {
    const title = document.title; document.title = 'Your cart | Nexus';
    return () => { document.title = title; };
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    menu.current?.querySelector('button')?.focus();
    const escape = event => { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); } };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [menuOpen]);
  const navigate = (path, options) => { setMenuOpen(false); onNavigate(path, options); };
  const remove = async id => {
    if (await onRemove(id)) requestAnimationFrame(() => listHeading.current?.focus({ preventScroll: true }));
  };

  return <div className="nexus-client-dashboard nexus-cart">
    <a className="cd-skip" href="#cart-main">Skip to cart</a>{previewControls}
    <div className="cd-layout">
      <aside className="cd-sidebar">
        <div className="cd-brand-row"><button className="cd-brand" onClick={() => navigate('/')} aria-label="Nexus home"><img src={Logo} alt="" width="44" height="44" /><span>NEXUS<span>.</span></span></button><button className="cd-menu-button" ref={menuButton} onClick={() => setMenuOpen(value => !value)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="cart-navigation">{menuOpen ? <FiX /> : <FiMenu />}</button></div>
        <div className={`cd-sidebar-body ${menuOpen ? 'is-open' : ''}`} id="cart-navigation" ref={menu}><span className="cd-nav-label">YOUR WORKSPACE</span>
          <nav aria-label="Client navigation"><button onClick={() => navigate('/client-dashboard')}><FiGrid aria-hidden="true" />Overview</button><button onClick={() => navigate('/new-order')}><FiPlus aria-hidden="true" />Create an order</button><button className="is-current" aria-current="page" onClick={() => { setMenuOpen(false); listHeading.current?.focus(); listHeading.current?.scrollIntoView({ block: 'start' }); }}><FiShoppingBag aria-hidden="true" />My cart<span className="cd-nav-count">{showTotals ? totals.quantity : '—'}</span></button><button onClick={() => navigate('/settings', { state: { role: 'client' } })}><FiSettings aria-hidden="true" />Settings</button></nav>
          <div className="cd-sidebar-guide"><span><FiCompass aria-hidden="true" /></span><h2>Every detail helps.</h2><p>A quick review now helps your traveler bring exactly what you need.</p><button onClick={() => navigate('/#how-it-works')}>How Nexus works <FiArrowUpRight aria-hidden="true" /></button></div>
          <div className="cd-account"><span className="cd-avatar" aria-hidden="true">{name.split(/\s+/).slice(0, 2).map(part => part[0]).join('')}</span><div><strong>{name}</strong><span>Client account</span></div><button onClick={onLogout} disabled={logoutLoading || busy} aria-label={logoutLoading ? 'Logging out' : 'Log out'}>{logoutLoading ? <span className="cd-spinner" /> : <FiLogOut aria-hidden="true" />}</button></div>
        </div>
      </aside>
      <main className="cd-main" id="cart-main" tabIndex={-1}>
        <div className="no-breadcrumb"><button onClick={() => navigate('/client-dashboard')}><FiArrowLeft aria-hidden="true" />Your dashboard</button><span>/</span><span>Your cart</span></div>
        <header className="cd-page-header"><div><span className="cd-eyebrow">GOOD FINDS. ONE STEP CLOSER.</span><h1>A little closer to yours<span>.</span></h1><p>Review your finds before their next journey begins.</p></div><button className="cd-button cd-secondary" onClick={() => navigate('/new-order')} disabled={busy}><FiPlus aria-hidden="true" />Add another item</button></header>
        <ol className="no-steps nc-steps" aria-label="Order process"><li className="is-done"><span><FiCheck aria-hidden="true" /></span><div><strong>Your item</strong><small>The details are in</small></div></li><li aria-current="step"><span>02</span><div><strong>Review your cart</strong><small>Make sure it’s right</small></div></li><li><span>03</span><div><strong>Checkout</strong><small>Complete your order</small></div></li></ol>
        {notice && <p className="cd-notice" role="status">{notice}</p>}
        {actionError?.message && !actionError.id && <p className="cd-error" role="alert">{actionError.message}</p>}
        <div className="nc-grid">
          <section className="nc-items cd-surface" aria-labelledby="cart-items-heading"><div className="cd-section-heading"><div><h2 id="cart-items-heading" ref={listHeading} tabIndex={-1}>Your cart{showTotals && <span className="nc-heading-count">{items.length}</span>}</h2><p>{showTotals && items.length ? `${totals.quantity} ${totals.quantity === 1 ? 'item' : 'items'} waiting for the next step.` : 'A little review goes a long way.'}</p></div><button className="cd-icon-button" onClick={onRetry} disabled={loading || busy} aria-label="Refresh cart"><FiRefreshCw aria-hidden="true" /></button></div>
            {loading ? <div className="cd-empty nc-state" role="status"><span className="cd-spinner" /><h3>Gathering your good finds…</h3><p>Your cart will be ready in a moment.</p></div> : error ? <div className="cd-empty nc-state"><span className="cd-empty-icon"><FiRefreshCw aria-hidden="true" /></span><h3>Let’s try that again.</h3><p role="alert">{error}</p><button className="cd-button cd-primary" onClick={onRetry}>Try again <FiRefreshCw aria-hidden="true" /></button></div> : !items.length ? <div className="nc-empty"><div className="nc-empty-art" aria-hidden="true"><span><FiShoppingBag /></span><i><FiPlus /></i></div><span className="cd-eyebrow">ROOM FOR SOMETHING GOOD</span><h3>Your next good find starts here.</h3><p>Your cart is empty. Tell us what you need, and take the first step toward bringing it home.</p><button className="cd-button cd-primary" onClick={() => navigate('/new-order')}>Create an order <FiArrowUpRight aria-hidden="true" /></button></div> : <>
              <ul className="nc-item-list">{items.map((item, index) => <li key={item.rowId} className="nc-item">
                <div className="nc-item-main"><CartImage item={item} /><div className="nc-item-copy"><span className="nc-category">{item.category && item.category !== 'N/A' ? item.category : 'Your item'}</span><h3>{item.productName}</h3><div className="nc-item-facts"><span>Quantity <strong>{item.quantity ?? '—'}</strong></span><span>{formatMoney(item.productFee)} per item</span></div><p className="nc-line-note">Service fee included in item total.</p></div><div className="nc-item-price"><small>Item total</small><strong>{formatMoney(item.finalCharge)}</strong></div></div>
                {!isCartItemValid(item) && <p className="nc-unavailable"><FiPackage aria-hidden="true" />{item.productId ? 'Some item details are unavailable. Refresh your cart or remove this item to continue.' : 'This product is no longer available. Refresh your cart to check for an update.'}</p>}
                <div className="nc-item-bottom"><span className="nc-item-number">ITEM {String(index + 1).padStart(2, '0')}</span><div><button className="nc-edit" onClick={() => navigate('/new-order', { state: { itemToEdit: item } })} disabled={busy || !item.productId} aria-label={`Edit ${item.productName}`}><FiEdit2 aria-hidden="true" />Edit details</button><button className="nc-remove" onClick={() => remove(item.productId)} disabled={busy || !item.productId} aria-label={busy && removingId === item.productId ? `Removing ${item.productName}` : `Remove ${item.productName}`}>{busy && removingId === item.productId ? <><span className="cd-spinner" />Removing…</> : <><FiTrash2 aria-hidden="true" />Remove</>}</button></div></div>
                {actionError?.id === item.productId && <p className="nc-item-error" role="alert">{actionError.message}</p>}
              </li>)}</ul><div className="nc-list-footer"><FiCheckCircle aria-hidden="true" /><p>Need to change product or delivery details? Select <strong>Edit details</strong> before checkout.</p></div>
            </>}
          </section>
          <aside className="nc-summary-column">
            <section className="nc-summary cd-surface" aria-labelledby="cart-summary-heading"><div className="nc-summary-heading"><span className="cd-eyebrow">THE NEXT STEP STARTS HERE</span><h2 id="cart-summary-heading">Your order summary.</h2><span className="nc-summary-bag" aria-hidden="true"><FiShoppingBag /></span></div><div className="nc-summary-body"><div className="nc-summary-count"><FiPackage aria-hidden="true" /><span>{showTotals ? `${totals.quantity} ${totals.quantity === 1 ? 'item' : 'items'} · ${items.length} ${items.length === 1 ? 'product' : 'products'}` : 'Getting your cart ready'}</span></div><dl className="nc-totals"><div><dt>Product subtotal</dt><dd>{formatMoney(showTotals ? totals.subtotal : null)}</dd></div><div><dt>Service fee <span>15%</span></dt><dd>{formatMoney(showTotals ? totals.fee : null)}</dd></div><div className="nc-total"><dt>Total</dt><dd><output aria-live="polite">{formatMoney(showTotals ? totals.total : null)}</output></dd></div></dl><p className="nc-fee-note">The service fee is already included in this total.</p><button className="cd-button cd-primary nc-checkout" disabled={!showTotals || !totals.canCheckout || busy} onClick={() => navigate('/checkout')}>Continue to checkout <FiArrowRight aria-hidden="true" /></button>{showTotals && unavailable ? <p className="nc-checkout-note">Refresh your cart to resolve unavailable items before checkout.</p> : showTotals && !items.length ? <p className="nc-checkout-note">Add an item to continue.</p> : <p className="nc-checkout-note">Choose your payment method on the next page.</p>}<div className="nc-summary-footer"><FiShield aria-hidden="true" /><span>No payment is taken on this page.</span></div></div></section>
            <section className="nc-next" aria-labelledby="cart-next-heading"><span className="nc-next-icon"><FiSend aria-hidden="true" /></span><h2 id="cart-next-heading">And then, the journey.</h2><p>After checkout, follow your order’s progress from your dashboard.</p><button onClick={() => navigate('/client-dashboard')}>Back to your dashboard <FiArrowUpRight aria-hidden="true" /></button></section>
          </aside>
        </div>
        <footer className="cd-footer"><span>© {new Date().getFullYear()} Nexus</span><span>Good things travel together.</span></footer>
      </main>
    </div>
  </div>;
};
CartView.propTypes = {
  user: PropTypes.object, items: PropTypes.arrayOf(PropTypes.object).isRequired, loading: PropTypes.bool,
  error: PropTypes.string, removingId: PropTypes.string, actionError: PropTypes.object, notice: PropTypes.string,
  logoutLoading: PropTypes.bool, onRetry: PropTypes.func.isRequired, onRemove: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired, onLogout: PropTypes.func.isRequired, previewControls: PropTypes.node,
};
export default CartView;
