import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FiArrowLeft, FiArrowRight, FiArrowUpRight, FiCheck, FiClock, FiCompass, FiCreditCard, FiGrid, FiLock, FiLogOut, FiMail, FiMenu, FiPackage, FiPlus, FiRefreshCw, FiSend, FiSettings, FiShield, FiShoppingBag, FiSmartphone, FiX } from 'react-icons/fi';
import Logo from '../assets/NexusLogo.png';
import { formatMoney } from './clientDashboardModel';
import { cartTotals } from './cartModel';
import { paymentMethods, validateCheckout } from './checkoutModel';
import './clientDashboard.css';
import './newOrder.css';
import './cart.css';
import './checkout.css';

const CheckoutView = ({ user, items, loading, error, submitting, result, logoutLoading, notice, onRetry, onSubmit, onNavigate, onLogout, previewControls }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({ method: '', phone: '', email: user?.email || '' });
  const [errors, setErrors] = useState({});
  const menu = useRef(null), menuButton = useRef(null), status = useRef(null), submitLock = useRef(false);
  const totals = cartTotals(items);
  const ready = !loading && !error;
  const sample = import.meta.env.DEV && result?.sample;
  const locked = submitting || result?.kind === 'pending' || result?.kind === 'redirect';
  const name = user?.name || 'Your account';
  const method = paymentMethods.find(option => option.id === form.method);
  useEffect(() => { const title = document.title; document.title = 'Checkout | Nexus'; return () => { document.title = title; }; }, []);
  useEffect(() => {
    if (!menuOpen) return;
    menu.current?.querySelector('button')?.focus();
    const escape = event => { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); } };
    window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape);
  }, [menuOpen]);
  useEffect(() => { if (result) status.current?.focus(); }, [result]);
  const navigate = (path, options) => { if (submitting) return; setMenuOpen(false); onNavigate(path, options); };
  const change = (field, value) => { setForm(previous => ({ ...previous, [field]: value })); setErrors(previous => ({ ...previous, [field]: '' })); };
  const submit = async event => {
    event.preventDefault();
    if (locked || !ready || submitLock.current) return;
    const next = validateCheckout(form, items); setErrors(next);
    if (Object.keys(next).length) { document.getElementById(`checkout-${next.method ? 'method-mpesa' : next.phone ? 'phone' : next.email ? 'email' : 'payment-heading'}`)?.focus(); return; }
    submitLock.current = true;
    try { await onSubmit(form); } finally { submitLock.current = false; }
  };

  return <div className="nexus-client-dashboard nexus-checkout">
    <a className="cd-skip" href="#checkout-main">Skip to checkout</a>{previewControls}
    <div className="cd-layout">
      <aside className="cd-sidebar">
        <div className="cd-brand-row"><button className="cd-brand" onClick={() => navigate('/')} aria-label="Nexus home"><img src={Logo} alt="" width="44" height="44" /><span>NEXUS<span>.</span></span></button><button className="cd-menu-button" ref={menuButton} onClick={() => setMenuOpen(value => !value)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="checkout-navigation">{menuOpen ? <FiX /> : <FiMenu />}</button></div>
        <div className={`cd-sidebar-body ${menuOpen ? 'is-open' : ''}`} id="checkout-navigation" ref={menu}><span className="cd-nav-label">YOUR WORKSPACE</span>
          <nav aria-label="Client navigation"><button onClick={() => navigate('/client-dashboard')}><FiGrid aria-hidden="true" />Overview</button><button onClick={() => navigate('/new-order')}><FiPlus aria-hidden="true" />Create an order</button><button className="is-current" onClick={() => navigate('/cart')}><FiShoppingBag aria-hidden="true" />My cart<span className="cd-nav-count">{ready ? totals.quantity : '—'}</span></button><button onClick={() => navigate('/settings?as=client', { state: { role: 'client' } })}><FiSettings aria-hidden="true" />Settings</button></nav>
          <div className="cd-sidebar-guide"><span><FiCompass aria-hidden="true" /></span><h2>Every detail helps.</h2><p>A quick review now helps your traveler bring exactly what you need.</p><button onClick={() => navigate('/#how-it-works')}>How Nexus works <FiArrowUpRight aria-hidden="true" /></button></div>
          <div className="cd-account"><span className="cd-avatar" aria-hidden="true">{name.split(/\s+/).slice(0, 2).map(part => part[0]).join('')}</span><div><strong>{name}</strong><span>Client account</span></div><button onClick={onLogout} disabled={logoutLoading || locked} aria-label={logoutLoading ? 'Logging out' : 'Log out'}>{logoutLoading ? <span className="cd-spinner" /> : <FiLogOut aria-hidden="true" />}</button></div>
        </div>
      </aside>
      <main className="cd-main" id="checkout-main" tabIndex={-1}>
        <div className="no-breadcrumb"><button onClick={() => navigate('/cart')} disabled={submitting}><FiArrowLeft aria-hidden="true" />Your cart</button><span>/</span><span>Checkout</span></div>
        <header className="cd-page-header"><div><span className="cd-eyebrow">ONE LAST STEP. A NEW JOURNEY.</span><h1>Bring it a little closer<span>.</span></h1><p>Choose how you’d like to pay. We’ll guide you through the next step.</p></div><span className="co-header-label"><FiLock aria-hidden="true" />Checkout</span></header>
        <ol className="no-steps nc-steps" aria-label="Order process"><li className="is-done"><span><FiCheck aria-hidden="true" /></span><div><strong>Your item</strong><small>The details are in</small></div></li><li className="is-done"><span><FiCheck aria-hidden="true" /></span><div><strong>Review your cart</strong><small>Ready for the next step</small></div></li><li aria-current="step"><span>03</span><div><strong>Checkout</strong><small>Choose how to pay</small></div></li></ol>
        {notice && <p className="cd-notice" role="status">{notice}</p>}
        <div className="co-grid">
          <div className="co-main-column">
            {result && <section className={`co-result co-result-${result.kind}`} ref={status} tabIndex={-1} aria-labelledby="checkout-result-heading">
              <span className="co-result-icon" aria-hidden="true">{result.kind === 'error' ? <FiRefreshCw /> : result.kind === 'redirect' ? <FiArrowUpRight /> : <FiClock />}</span>
              <div><span className="cd-eyebrow">{sample ? 'SAMPLE PAYMENT FLOW' : 'YOUR PAYMENT'}</span><h2 id="checkout-result-heading">{result.kind === 'error' ? 'We couldn’t confirm your request.' : result.kind === 'redirect' ? sample ? 'Ready for the next step.' : 'Continue with Paystack.' : sample ? 'This is the phone approval step.' : 'Check your phone.'}</h2>
                <p role={result.kind === 'error' ? 'alert' : 'status'}>{result.message || (result.kind === 'pending' ? 'Approve the request in your mobile wallet. Payment is still awaiting confirmation; this is not a receipt.' : 'Complete payment on Paystack’s checkout page. Your payment is not confirmed yet.')}</p>
                {result.orderNumber && <p className="co-reference">Order reference <strong>{result.orderNumber}</strong></p>}
                {result.kind !== 'error' && <button className="cd-button cd-secondary" onClick={() => navigate('/client-dashboard')}>Go to your dashboard <FiArrowUpRight aria-hidden="true" /></button>}
                {result.kind === 'error' && <button className="cd-text-link" onClick={() => navigate('/client-dashboard')}>Check your orders <FiArrowUpRight aria-hidden="true" /></button>}
              </div>
            </section>}
            <section className="cd-surface co-payment" aria-labelledby="checkout-payment-heading">
              <div className="co-section-title"><span className="co-section-icon"><FiCreditCard aria-hidden="true" /></span><div><h2 id="checkout-payment-heading" tabIndex={-1}>Your way to pay.</h2><p>A few details, then you’re on your way.</p></div></div>
              {loading ? <div className="cd-empty co-state" role="status"><span className="cd-spinner" /><h3>Preparing your checkout…</h3><p>We’re checking your cart and total.</p></div> : error ? <div className="cd-empty co-state"><FiRefreshCw aria-hidden="true" /><h3>Let’s try that again.</h3><p role="alert">{error}</p><button className="cd-button cd-primary" onClick={onRetry}>Try again <FiRefreshCw aria-hidden="true" /></button></div> : !items.length ? <div className="cd-empty co-state"><span className="cd-empty-icon"><FiShoppingBag aria-hidden="true" /></span><h3>Your next good find starts here.</h3><p>Add an item to your cart before checking out.</p><button className="cd-button cd-primary" onClick={() => navigate('/new-order')}>Create an order <FiPlus aria-hidden="true" /></button></div> : !totals.canCheckout ? <div className="cd-empty co-state"><FiPackage aria-hidden="true" /><h3>A quick cart check first.</h3><p>Some item details are unavailable. Review your cart before continuing.</p><button className="cd-button cd-primary" onClick={() => navigate('/cart')}>Review your cart <FiArrowRight aria-hidden="true" /></button></div> : <form onSubmit={submit} noValidate>
                <fieldset className="co-methods" disabled={locked} aria-describedby={errors.method ? 'checkout-method-error' : undefined}>
                  <legend>Choose a payment method</legend>
                  {paymentMethods.map(option => <label className={`co-method ${form.method === option.id ? 'is-selected' : ''} ${option.disabled ? 'is-unavailable' : ''}`} key={option.id}>
                    <input id={`checkout-method-${option.id}`} type="radio" name="payment-method" value={option.id} checked={form.method === option.id} onChange={() => change('method', option.id)} disabled={option.disabled || locked} aria-invalid={Boolean(errors.method)} aria-describedby={errors.method ? 'checkout-method-error' : undefined} />
                    <span className={`co-method-mark co-mark-${option.id}`} aria-hidden="true">{option.mark === 'card' ? <FiCreditCard /> : option.mark}</span>
                    <span className="co-method-copy"><strong>{option.label}</strong><small>{option.hint}</small></span><span className="co-radio" aria-hidden="true">{form.method === option.id && <FiCheck />}</span>
                  </label>)}
                </fieldset>
                {errors.method && <p id="checkout-method-error" className="co-field-error" role="alert">{errors.method}</p>}
                {method?.type === 'mobile' && <div className="co-details">
                  <div className="co-detail-title"><FiSmartphone aria-hidden="true" /><h3>Send the request to your phone.</h3></div>
                  <label htmlFor="checkout-phone">{method.label} number</label>
                  <input id="checkout-phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={event => change('phone', event.target.value)} placeholder="e.g. 0712 345 678" maxLength={24} required disabled={locked} aria-invalid={Boolean(errors.phone)} aria-describedby={`checkout-phone-hint${errors.phone ? ' checkout-phone-error' : ''}`} />
                  <p id="checkout-phone-hint">Use the Kenyan mobile number you want to pay from. You’ll approve the request on that phone.</p>
                  {errors.phone && <p id="checkout-phone-error" className="co-field-error" role="alert">{errors.phone}</p>}
                  {form.method === 'mpesa' && !Number.isInteger(totals.total) && <p className="co-rounding">M-Pesa requests use whole shillings. Your phone request will be for <strong>{formatMoney(Math.ceil(totals.total))}</strong>.</p>}
                </div>}
                {method?.type === 'hosted' && <div className="co-details">
                  <div className="co-detail-title"><FiMail aria-hidden="true" /><h3>A receipt needs a destination.</h3></div>
                  <label htmlFor="checkout-email">Payment email</label>
                  <input id="checkout-email" type="email" autoComplete="email" value={form.email} onChange={event => change('email', event.target.value)} placeholder="you@example.com" maxLength={254} required disabled={locked} aria-invalid={Boolean(errors.email)} aria-describedby={`checkout-email-hint${errors.email ? ' checkout-email-error' : ''}`} />
                  <p id="checkout-email-hint">Continue to Paystack to complete payment. Enter payment details on their checkout page.</p>
                  {errors.email && <p id="checkout-email-error" className="co-field-error" role="alert">{errors.email}</p>}
                  {!Number.isInteger(totals.total) && <p className="co-rounding">Paystack is currently available for whole-shilling totals. Choose M-Pesa or Airtel Money for this order.</p>}
                </div>}
                {errors.cart && <p className="co-field-error" role="alert">{errors.cart}</p>}
                <div className="co-pay-action"><div><span>Order total</span><strong>{formatMoney(totals.total)}</strong></div><button className="cd-button cd-primary" type="submit" disabled={locked}>{submitting ? <><span className="cd-spinner" />Starting your payment…</> : locked ? 'Payment request started' : <>{method?.type === 'hosted' ? 'Continue to Paystack' : method?.type === 'mobile' ? 'Send payment request' : 'Continue to payment'}<FiArrowRight aria-hidden="true" /></>}</button></div>
                <p className="co-action-note"><FiShield aria-hidden="true" />{method?.type === 'hosted' ? 'You’ll complete your payment with Paystack.' : 'A phone request starts your payment. Approval and confirmation come next.'}</p>
              </form>}
            </section>
            <section className="co-next-steps" aria-labelledby="checkout-next-heading"><div><span className="cd-eyebrow">FROM HERE TO YOUR DOOR</span><h2 id="checkout-next-heading">And then, the journey begins.</h2></div><ol><li><span><FiCreditCard aria-hidden="true" /></span><strong>Complete payment</strong><p>Follow your chosen method’s instructions.</p></li><li><span><FiClock aria-hidden="true" /></span><strong>Wait for confirmation</strong><p>Your request needs to be confirmed.</p></li><li><span><FiSend aria-hidden="true" /></span><strong>Follow your order</strong><p>Keep up with its progress on your dashboard.</p></li></ol></section>
          </div>
          <aside className="co-summary-column">
            <section className="nc-summary cd-surface" aria-labelledby="checkout-summary-heading"><div className="nc-summary-heading"><span className="cd-eyebrow">YOUR GOOD FINDS, TOGETHER</span><h2 id="checkout-summary-heading">One journey closer.</h2><span className="nc-summary-bag" aria-hidden="true"><FiShoppingBag /></span></div><div className="nc-summary-body">
              <div className="co-summary-title"><span>{ready ? `${totals.quantity} ${totals.quantity === 1 ? 'item' : 'items'} in your cart` : 'Your order summary'}</span><button onClick={() => navigate('/cart')} disabled={locked}>Edit cart</button></div>
              {ready && items.length > 0 && <ul className="co-items">{items.map(item => <li key={item.rowId}><span className="co-item-icon" aria-hidden="true"><FiPackage /></span><div><h3>{item.productName}</h3><span>Qty {item.quantity ?? '—'} · {item.category && item.category !== 'N/A' ? item.category : 'Your item'}</span></div><strong>{formatMoney(item.finalCharge)}</strong></li>)}</ul>}
              <dl className="nc-totals"><div><dt>Product subtotal</dt><dd>{formatMoney(ready ? totals.subtotal : null)}</dd></div><div><dt>Service fee <span>15%</span></dt><dd>{formatMoney(ready ? totals.fee : null)}</dd></div><div className="nc-total"><dt>Total</dt><dd>{formatMoney(ready ? totals.total : null)}</dd></div></dl><p className="nc-fee-note">The service fee is already included in this total.</p>
              <div className="co-summary-note"><FiPackage aria-hidden="true" /><p>Product and delivery details stay with each item. Need a change? Return to your cart before paying.</p></div>
            </div></section>
            <div className="co-return"><FiArrowLeft aria-hidden="true" /><button onClick={() => navigate('/cart')} disabled={locked}>Take another look at your cart</button></div>
          </aside>
        </div>
        <footer className="cd-footer"><span>© {new Date().getFullYear()} Nexus</span><span>Good things travel together.</span></footer>
      </main>
    </div>
  </div>;
};
CheckoutView.propTypes = {
  user: PropTypes.object, items: PropTypes.arrayOf(PropTypes.object).isRequired, loading: PropTypes.bool,
  error: PropTypes.string, submitting: PropTypes.bool, result: PropTypes.object, notice: PropTypes.string,
  logoutLoading: PropTypes.bool, onRetry: PropTypes.func.isRequired, onSubmit: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired, onLogout: PropTypes.func.isRequired, previewControls: PropTypes.node,
};
export default CheckoutView;
