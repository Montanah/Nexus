import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FiArrowLeft, FiArrowUpRight, FiCalendar, FiCheck, FiCheckCircle, FiClock, FiCompass, FiImage, FiLogOut, FiMapPin, FiMenu, FiPackage, FiRefreshCw, FiSend, FiSettings, FiShield, FiStar, FiX } from 'react-icons/fi';
import Logo from '../assets/NexusLogo.png';
import DeliveryProofForm from './DeliveryProofForm';
import { formatDate, formatMoney } from './clientDashboardModel';
import { statusLabels } from './travelerDashboardModel';
import { deliveryAction, deliveryDestination } from './deliveryDetailsModel';
import './clientDashboard.css';
import './travelerDashboard.css';
import './deliveryDetails.css';

const Gallery = ({ product }) => {
  const [selected, setSelected] = useState(0), [failed, setFailed] = useState([]);
  const photos = product.productPhotos;
  const src = photos[selected];
  return <section className="dd-gallery cd-surface" aria-label="Product photos">
    <div className="dd-gallery-image">{src && !failed.includes(src) ? <img src={src} alt={`${product.productName}, photo ${selected + 1}`} onError={() => setFailed(previous => [...previous, src])} /> : <div className="dd-photo-placeholder"><span className="dd-photo-orbit" /><span><FiPackage aria-hidden="true" /></span><p>{src ? 'This photo is unavailable.' : 'No photos provided.'}</p><small>The item details are listed below.</small></div>}<span className="dd-gallery-label"><FiImage aria-hidden="true" />{photos.length ? `${selected + 1} / ${photos.length}` : 'PRODUCT PHOTOS'}</span></div>
    {photos.length > 1 && <div className="dd-thumbnails" role="group" aria-label="Choose a product photo">{photos.map((photo, index) => <button key={`${photo}-${index}`} type="button" aria-label={`View photo ${index + 1}`} aria-pressed={selected === index} onClick={() => setSelected(index)}>{failed.includes(photo) ? <FiImage aria-hidden="true" /> : <img src={photo} alt="" onError={() => setFailed(previous => [...previous, photo])} />}</button>)}</div>}
  </section>;
};
Gallery.propTypes = { product: PropTypes.object.isRequired };

const Progress = ({ status, proofUploaded }) => {
  const index = { Pending: -1, Assigned: 0, Shipped: 1, 'Traveler Confirmed': 2, 'Client Confirmed': 3, Complete: 4, Delivered: 4 }[status];
  return <section className="dd-progress cd-surface" aria-labelledby="delivery-progress-heading"><div className="dd-section-heading"><span><FiSend aria-hidden="true" /></span><div><span className="cd-eyebrow">ONE STEP AT A TIME</span><h2 id="delivery-progress-heading">The journey so far.</h2></div></div>
    {index === undefined ? <p className="dd-progress-note">{status === 'Cancelled' ? 'This delivery has been cancelled. No further action is needed.' : 'The delivery stage is unavailable. Refresh to check for updates.'}</p> : <>
      <ol aria-label="Delivery progress">{['Accepted', 'Shipped', 'Handed over', 'Client confirmed', 'Completed'].map((label, step) => <li key={label} className={step <= index ? 'is-reached' : ''} aria-current={step === index ? 'step' : undefined}><span>{step <= index ? <FiCheck aria-hidden="true" /> : step + 1}</span><strong>{label}</strong></li>)}</ol>
      <p className="dd-progress-note">{proofUploaded ? 'Your proof is saved. Finish updating the delivery status to complete the journey.' : status === 'Pending' ? 'The journey starts when a traveler accepts this delivery.' : status === 'Traveler Confirmed' ? 'Handover recorded. The client’s receipt confirmation comes next.' : status === 'Client Confirmed' ? 'Receipt confirmed. Submit your delivery proof to finish.' : ['Complete', 'Delivered'].includes(status) ? 'This item has reached the end of its delivery journey.' : 'Keep the client up to date as the item makes its way to them.'}</p>
    </>}
  </section>;
};
Progress.propTypes = { status: PropTypes.string.isRequired, proofUploaded: PropTypes.bool };

const NextStep = ({ context, busy, onClaim, onAdvance, onUpload, onRetry, onNavigate }) => {
  const action = deliveryAction(context), product = context.product;
  const messages = {
    claim: ['A good fit for your trip?', 'Check the destination, arrival date, and shipping restrictions before accepting.'],
    ship: ['Ready for the journey.', 'Mark this item as shipped once it is on its way to the client.'],
    handover: ['At the destination?', 'Confirm the handover after giving the item to the client. They’ll confirm receipt next.'],
    wait: ['Over to your client.', 'The client needs to confirm receipt before you can submit delivery proof.'],
    proof: ['They’ve confirmed arrival.', 'Add a clear photo or document as proof of delivery to finish this journey.'],
    finish: ['Proof saved. One last step.', 'Finish updating this delivery’s status. You don’t need to upload the file again.'],
    rate: ['Another happy arrival.', 'This delivery is complete. Share a little feedback about your client.'],
  };
  const [title, description] = messages[action] || (product.deliveryStatus === 'Cancelled' ? ['This journey is cancelled.', 'There are no further actions for this item.'] : product.deliveryStatus === 'Delivered' ? ['Delivery recorded.', 'This item is marked as delivered.'] : ['No action available.', 'Refresh the details or return to your dashboard for the latest deliveries.']);
  return <section className="dd-next" aria-labelledby="delivery-next-heading"><span className="cd-eyebrow">{context.available ? 'YOUR NEXT CONNECTION' : 'YOUR NEXT STEP'}</span><h2 id="delivery-next-heading" tabIndex={-1}>{title}</h2><p>{description}</p>
    {action === 'claim' && <button className="cd-button cd-primary" disabled={busy} onClick={onClaim}>{busy ? 'Accepting…' : 'Accept delivery'}<FiArrowUpRight aria-hidden="true" /></button>}
    {['ship', 'handover', 'finish'].includes(action) && <button className="cd-button cd-primary" disabled={busy} onClick={onAdvance}>{busy ? 'Updating…' : { ship: 'Mark as shipped', handover: 'Confirm handover', finish: 'Finish delivery' }[action]}<FiCheckCircle aria-hidden="true" /></button>}
    {action === 'wait' && <button className="cd-button cd-secondary" disabled={busy} onClick={onRetry}><FiRefreshCw aria-hidden="true" />Check for confirmation</button>}
    {action === 'proof' && <DeliveryProofForm busy={busy} onUpload={onUpload} />}
    {action === 'rate' && (product.clientRating != null ? <p className="dd-rated"><FiStar aria-hidden="true" />Client rated: {product.clientRating}/5</p> : <button className="cd-button cd-secondary" disabled={busy} onClick={() => onNavigate(`/rate-product/${encodeURIComponent(product.productId)}?as=traveler`)}><FiStar aria-hidden="true" />Rate your client</button>)}
  </section>;
};
NextStep.propTypes = { context: PropTypes.object.isRequired, busy: PropTypes.bool, onClaim: PropTypes.func.isRequired, onAdvance: PropTypes.func.isRequired, onUpload: PropTypes.func.isRequired, onRetry: PropTypes.func.isRequired, onNavigate: PropTypes.func.isRequired };

const DeliveryDetailsView = ({ user, context, phase = 'ready', busy = '', error = '', notice = '', onRetry, onClaim, onAdvance, onUpload, onNavigate, onLogout, previewControls }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null), menu = useRef(null), feedback = useRef(null);
  const product = context?.product;
  const locked = Boolean(busy), ready = phase === 'ready' && Boolean(product);
  const name = user?.name?.trim() || 'Your account';
  const initials = name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const dashboard = `/traveler-dashboard?view=${context?.owned ? 'deliveries' : 'discover'}${product ? `&product=${encodeURIComponent(product.productId)}` : ''}`;
  useEffect(() => { const old = document.title; document.title = `${product?.productName || 'Delivery details'} | Nexus`; return () => { document.title = old; }; }, [product?.productName]);
  useEffect(() => { if (error || notice) feedback.current?.focus(); }, [error, notice]);
  useEffect(() => {
    if (!menuOpen) return;
    menu.current?.querySelector('button')?.focus();
    const escape = event => { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); } };
    document.addEventListener('keydown', escape); return () => document.removeEventListener('keydown', escape);
  }, [menuOpen]);
  const navigate = path => { if (!locked) { setMenuOpen(false); onNavigate(path); } };
  return <div className="nexus-client-dashboard nexus-delivery-details"><a className="cd-skip" href="#delivery-main">Skip to delivery details</a>{previewControls}<div className="cd-layout">
    <aside className="cd-sidebar"><div className="cd-brand-row"><button className="cd-brand" onClick={() => navigate('/')} aria-label="Nexus home" disabled={locked}><img src={Logo} alt="" width="44" height="44" /><span>NEXUS<span>.</span></span></button><button className="cd-menu-button" ref={menuButton} onClick={() => setMenuOpen(value => !value)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="delivery-navigation">{menuOpen ? <FiX /> : <FiMenu />}</button></div>
      <div className={`cd-sidebar-body ${menuOpen ? 'is-open' : ''}`} id="delivery-navigation" ref={menu}><span className="cd-nav-label">YOUR TRAVEL SPACE</span><nav aria-label="Traveler navigation">
        <button disabled={locked} onClick={() => navigate('/traveler-dashboard?view=discover')}><FiCompass aria-hidden="true" />Find deliveries</button><button disabled={locked} onClick={() => navigate('/traveler-dashboard?view=deliveries')}><FiPackage aria-hidden="true" />My deliveries</button><button className="is-current" aria-current="page" onClick={() => { setMenuOpen(false); document.querySelector('#delivery-heading')?.focus(); }}><FiSend aria-hidden="true" />Delivery details<span className="cd-nav-dot" /></button><button disabled={locked} onClick={() => navigate('/settings?as=traveler')}><FiSettings aria-hidden="true" />Settings</button>
      </nav><div className="cd-sidebar-guide"><span><FiCompass aria-hidden="true" /></span><h2>A little room.<br />A meaningful connection.</h2><p>Every good delivery starts with knowing the details.</p><button disabled={locked} onClick={() => navigate('/#how-it-works')}>How Nexus works<FiArrowUpRight aria-hidden="true" /></button></div><div className="cd-account"><span className="cd-avatar" aria-hidden="true">{initials}</span><div><strong>{name}</strong><span>Traveler account</span></div><button onClick={onLogout} disabled={locked} aria-label={busy === 'logout' ? 'Signing out' : 'Sign out'}>{busy === 'logout' ? <span className="cd-spinner" /> : <FiLogOut aria-hidden="true" />}</button></div></div>
    </aside>
    <main className="cd-main" id="delivery-main" tabIndex={-1}>
      <div className="dd-breadcrumb"><button disabled={locked} onClick={() => navigate(dashboard)}><FiArrowLeft aria-hidden="true" />Your deliveries</button><span>/</span><span>Delivery details</span></div>
      <header className="cd-page-header"><div><span className="cd-eyebrow">THE DETAILS MAKE THE JOURNEY</span><h1 id="delivery-heading" tabIndex={-1}>{ready ? product.productName : 'Delivery details'}<span>.</span></h1><p>{context?.owned ? 'Your delivery, from the first step to the final handover.' : 'A closer look at what you could bring a little closer.'}</p></div><div className="dd-header-actions"><button className="cd-button cd-secondary" onClick={onRetry} disabled={locked || phase === 'loading'}><FiRefreshCw aria-hidden="true" />Refresh details</button>{ready && <button className="cd-button cd-primary dd-next-shortcut" disabled={locked} onClick={() => { const heading = document.querySelector('#delivery-next-heading'); heading?.focus(); heading?.scrollIntoView({ block: 'start' }); }}>Next step<FiArrowUpRight aria-hidden="true" /></button>}</div></header>
      {(error || notice) && <p className={error ? 'cd-error dd-feedback' : 'cd-notice dd-feedback'} ref={feedback} tabIndex={-1} role={error ? 'alert' : 'status'}>{error || notice}</p>}
      {!ready ? <section className="cd-surface cd-empty dd-page-state">{phase === 'loading' ? <><span className="cd-spinner" /><h2>Getting the details together…</h2><p role="status">Finding the item and its latest delivery stage.</p></> : <><span className="cd-empty-icon"><FiPackage aria-hidden="true" /></span><h2>{phase === 'missing' ? 'This delivery isn’t available.' : 'Let’s try that again.'}</h2><p>{phase === 'missing' ? 'It may have been claimed, removed, or be outside your deliveries. Choose an item from your dashboard.' : 'We couldn’t load the delivery details. Please try again.'}</p><div><button className="cd-button cd-primary" onClick={onRetry} disabled={locked}>Try again<FiRefreshCw aria-hidden="true" /></button><button className="cd-button cd-secondary" onClick={() => navigate('/traveler-dashboard')} disabled={locked}>Back to dashboard</button></div></>}</section> : <>
        <section className="dd-destination" aria-label="Delivery destination"><span className="dd-destination-icon"><FiMapPin aria-hidden="true" /></span><div><span className="cd-eyebrow">HEADING TO</span><h2>{deliveryDestination(product)}</h2><p><FiCalendar aria-hidden="true" />Requested arrival · {formatDate(product.deliverydate, 'Not provided')}</p></div><span className="dd-status"><span />{statusLabels[product.deliveryStatus] || 'Status unavailable'}</span></section>
        <div className="dd-grid"><div className="dd-main-column"><Gallery key={JSON.stringify([product.productId, product.productPhotos])} product={product} />
          <section className="dd-item cd-surface" aria-labelledby="delivery-item-heading"><div className="dd-section-heading"><span><FiPackage aria-hidden="true" /></span><div><span className="cd-eyebrow">KNOW WHAT YOU’RE CARRYING</span><h2 id="delivery-item-heading">A closer look.</h2></div></div><p className="dd-description">{product.productDescription || 'No additional description provided.'}</p><dl className="dd-facts"><div><dt>Category</dt><dd>{product.categoryName}</dd></div><div><dt>Quantity</dt><dd>{product.quantity ?? 'Not provided'}</dd></div><div><dt>Weight</dt><dd>{product.productWeight ?? 'Not provided'}</dd></div><div><dt>Dimensions</dt><dd>{product.productDimensions || 'Not provided'}</dd></div><div><dt>Urgency</dt><dd className="dd-capitalize">{product.urgencyLevel || 'Not provided'}</dd></div><div><dt>Product price</dt><dd>{formatMoney(product.productPrice)}</dd></div></dl><div className="dd-restrictions"><FiShield aria-hidden="true" /><div><h3>Shipping & handling</h3><p>{product.shippingRestrictions || 'No specific restrictions provided. Check that the item fits your carrier’s rules before accepting.'}</p></div></div></section>
          <Progress status={product.deliveryStatus} proofUploaded={product.proofUploaded} />
        </div><aside className="dd-aside"><section className="dd-reward-card cd-surface" aria-labelledby="delivery-reward-heading"><div className="dd-reward-heading"><span className="cd-eyebrow">A LITTLE EXTRA FOR YOUR JOURNEY</span><h2 id="delivery-reward-heading">Your delivery reward.</h2><strong>{formatMoney(product.rewardAmount)}</strong><p>The traveler reward listed for this item.</p><span className="dd-reward-art" aria-hidden="true"><FiSend /></span></div><dl><div><dt>Destination</dt><dd>{deliveryDestination(product)}</dd></div><div><dt>Requested arrival</dt><dd>{formatDate(product.deliverydate, 'Not provided')}</dd></div>{product.orderNumber && <div><dt>Item reference</dt><dd>{product.orderNumber}</dd></div>}</dl><NextStep context={context} busy={locked} onClaim={onClaim} onAdvance={onAdvance} onUpload={onUpload} onRetry={onRetry} onNavigate={navigate} /></section>
          <section className="dd-note"><span><FiShield aria-hidden="true" /></span><h2>A clear handover.<br />A shared confirmation.</h2><p>Check the details before you set off. After handover, the client confirms receipt and you submit delivery proof.</p><div><FiClock aria-hidden="true" /><span>The requested arrival date helps you plan your journey.</span></div></section><button className="dd-back" onClick={() => navigate(dashboard)} disabled={locked}><FiArrowLeft aria-hidden="true" />Back to your deliveries</button>
        </aside></div>
      </>}
      <footer className="cd-footer"><span>© {new Date().getFullYear()} Nexus</span><span>Good things travel together.</span></footer>
    </main>
  </div></div>;
};
DeliveryDetailsView.propTypes = { user: PropTypes.object, context: PropTypes.object, phase: PropTypes.string, busy: PropTypes.string, error: PropTypes.string, notice: PropTypes.string, onRetry: PropTypes.func.isRequired, onClaim: PropTypes.func.isRequired, onAdvance: PropTypes.func.isRequired, onUpload: PropTypes.func.isRequired, onNavigate: PropTypes.func.isRequired, onLogout: PropTypes.func.isRequired, previewControls: PropTypes.node };
export default DeliveryDetailsView;
