import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FiArrowLeft, FiArrowRight, FiArrowUpRight, FiCheck, FiCheckCircle, FiClock, FiCopy, FiCreditCard, FiGrid, FiHelpCircle, FiLock, FiPackage, FiRefreshCw, FiSend, FiShoppingBag, FiX } from 'react-icons/fi';
import Logo from '../assets/NexusLogo.png';
import { formatDate, formatMoney } from './clientDashboardModel';
import { resultContent } from './paymentResultModel';
import './clientDashboard.css';
import './paymentResult.css';

const icons = { success: FiCheck, failed: FiX, pending: FiClock, error: FiRefreshCw, unconfirmed: FiHelpCircle, auth: FiLock, loading: FiRefreshCw };

const PaymentResultView = ({ payment, order, detailsLoading, detailsError, onVerify, onRetryDetails, onNavigate, previewControls }) => {
  const status = resultContent[payment.status] ? payment.status : 'unconfirmed';
  const content = resultContent[status], Icon = icons[status];
  const heading = useRef(null), previousStatus = useRef(status);
  const [copyNotice, setCopyNotice] = useState('');
  const success = status === 'success';
  const hasOrder = Boolean(payment.orderNumber);
  useEffect(() => { const title = document.title; document.title = `${content.label} | Nexus`; return () => { document.title = title; }; }, [content.label]);
  useEffect(() => {
    if (previousStatus.current !== status) { heading.current?.focus({ preventScroll: true }); previousStatus.current = status; }
    setCopyNotice('');
  }, [status, payment.orderNumber]);
  const copyReference = async () => {
    try { await navigator.clipboard.writeText(payment.orderNumber); setCopyNotice('Order reference copied.'); }
    catch { setCopyNotice('Couldn’t copy automatically. Select the order reference below to copy it.'); }
  };

  return <div className={`nexus-client-dashboard nexus-payment-result pr-${status}`}>
    <a className="cd-skip" href="#payment-result-main">Skip to payment status</a>{previewControls}
    <header className="pr-header"><div>
      <button className="cd-brand" onClick={() => onNavigate('/')} aria-label="Nexus home"><img src={Logo} alt="" width="44" height="44" /><span>NEXUS<span>.</span></span></button>
      <span className="pr-header-note">Good things travel together.</span>
      <button className="pr-dashboard-link" onClick={() => onNavigate(status === 'auth' ? '/login' : '/client-dashboard')}><FiGrid aria-hidden="true" />{status === 'auth' ? 'Sign in' : 'Your dashboard'}<FiArrowUpRight aria-hidden="true" /></button>
    </div></header>
    <main className="pr-main" id="payment-result-main" tabIndex={-1}>
      <div className="pr-breadcrumb"><span><FiShoppingBag aria-hidden="true" />Your order journey</span><span>/</span><span>Payment status</span></div>
      <div className="pr-grid">
        <div className="pr-main-column">
          <section className="pr-hero" aria-labelledby="payment-result-heading">
            <div className="pr-status-art" aria-hidden="true"><span className="pr-orbit pr-orbit-one" /><span className="pr-orbit pr-orbit-two" /><span className="pr-main-icon"><Icon /></span><span className="pr-floating-package"><FiPackage /></span><span className="pr-floating-spark">✦</span></div>
            <span className="pr-status-label"><span />{content.label}</span>
            <span className="cd-eyebrow">{content.eyebrow}</span><h1 id="payment-result-heading" ref={heading} tabIndex={-1}>{content.title}</h1>
            <p className="pr-description" role={status === 'error' ? 'alert' : 'status'}>{content.description}</p>
            <div className="pr-actions"><button className="cd-button cd-primary" disabled={content.disabled} onClick={() => content.retry ? onVerify() : onNavigate(content.destination)}>{status === 'loading' ? <span className="cd-spinner" /> : content.retry ? <FiRefreshCw aria-hidden="true" /> : <FiArrowUpRight aria-hidden="true" />}{content.primary}</button><button className="cd-button cd-secondary" onClick={() => onNavigate(content.secondaryDestination)}>{content.secondary}<FiArrowRight aria-hidden="true" /></button></div>
            <div className="pr-hero-foot"><FiLock aria-hidden="true" /><span>{success ? 'Keep your order reference for future updates.' : 'Checking payment status does not start another payment.'}</span></div>
          </section>
          <section className="pr-next" aria-labelledby="payment-next-heading">
            <div><span className="cd-eyebrow">{success ? 'THE JOURNEY CONTINUES' : 'A CLEAR NEXT STEP'}</span><h2 id="payment-next-heading">{success ? 'Here’s what comes next.' : 'Let’s take it one step at a time.'}</h2></div>
            <ol>{(success ? [
              [FiCheckCircle, 'Payment confirmed', 'Your payment status has been checked.'],
              [FiPackage, 'Watch for order updates', 'Your dashboard is the place to follow progress.'],
              [FiSend, 'Follow the journey', 'Keep up with your traveler and delivery updates.'],
            ] : [
              [FiCreditCard, 'Check your wallet', 'Look for a payment confirmation or debit.'],
              [FiGrid, 'Review your orders', 'Check for an existing order before starting again.'],
              [FiRefreshCw, 'Confirm before retrying', 'A delay in verification does not always mean a failed payment.'],
            ]).map(([StepIcon, title, description], index) => <li key={title}><span className="pr-step-icon"><StepIcon aria-hidden="true" /></span><div><span className="pr-step-number">0{index + 1}</span><h3>{title}</h3><p>{description}</p></div></li>)}</ol>
          </section>
        </div>
        <aside className="pr-details-column">
          <section className="pr-receipt" aria-labelledby="payment-details-heading">
            <div className="pr-receipt-heading"><span className="pr-receipt-icon"><FiCreditCard aria-hidden="true" /></span><span className="cd-eyebrow">THE DETAILS, ALL TOGETHER</span><h2 id="payment-details-heading">Your payment details.</h2></div>
            <div className="pr-receipt-body">
              <div className="pr-amount"><span>{success ? 'Amount paid' : 'Payment amount'}</span><strong>{formatMoney(payment.amount)}</strong><span className="pr-receipt-status">{content.label}</span></div>
              <dl className="pr-facts"><div><dt>Payment method</dt><dd>{payment.method || 'Not available'}</dd></div><div><dt>Order reference</dt><dd>{payment.orderNumber || 'Not available'}{hasOrder && <button onClick={copyReference} aria-label="Copy order reference"><FiCopy aria-hidden="true" /></button>}</dd></div>{payment.reference && <div><dt>Payment reference</dt><dd>{payment.reference}</dd></div>}<div><dt>Order placed</dt><dd>{formatDate(order?.createdAt, 'Not available')}</dd></div></dl>
              {copyNotice && <p className="pr-copy-notice" role="status">{copyNotice}</p>}
              <p className="pr-details-note">{hasOrder ? 'Use your order reference when checking progress on your dashboard.' : 'Payment details will appear here when they can be verified.'}</p>
            </div>
            <div className="pr-receipt-bottom" aria-hidden="true"><span /><FiPackage /><span /></div>
          </section>
          {hasOrder && <section className="pr-items cd-surface" aria-labelledby="payment-items-heading"><div className="pr-items-heading"><h2 id="payment-items-heading">In this order</h2>{order && <span>{order.items.length} {order.items.length === 1 ? 'product' : 'products'}</span>}</div>
            {detailsLoading ? <p className="pr-items-state" role="status"><span className="cd-spinner" />Loading your order details…</p> : detailsError ? <div className="pr-items-state"><p>Item details couldn’t be loaded. Your payment status above is unchanged.</p><button onClick={onRetryDetails}><FiRefreshCw aria-hidden="true" />Retry item details</button></div> : order?.items.length ? <ul>{order.items.map(item => <li key={item.id}><span className="pr-item-icon"><FiPackage aria-hidden="true" /></span><div><h3>{item.name}</h3><span>Quantity {item.quantity ?? 'not available'}</span></div></li>)}</ul> : <p className="pr-items-state">Item details are not available here. Check your order on the dashboard.</p>}
          </section>}
          <button className="pr-back-link" onClick={() => onNavigate(success ? '/client-dashboard' : '/checkout')}><FiArrowLeft aria-hidden="true" />{success ? 'Back to your dashboard' : 'Back to checkout'}</button>
        </aside>
      </div>
      <footer className="cd-footer"><span>© {new Date().getFullYear()} Nexus</span><span>A little closer to what you love.</span></footer>
    </main>
  </div>;
};
PaymentResultView.propTypes = {
  payment: PropTypes.object.isRequired, order: PropTypes.object, detailsLoading: PropTypes.bool, detailsError: PropTypes.bool,
  onVerify: PropTypes.func.isRequired, onRetryDetails: PropTypes.func.isRequired, onNavigate: PropTypes.func.isRequired, previewControls: PropTypes.node,
};
export default PaymentResultView;
