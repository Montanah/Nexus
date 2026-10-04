import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  FiArrowUpRight, FiCheck, FiCheckCircle, FiClock, FiCompass, FiDollarSign,
  FiFile, FiFilter, FiLogOut, FiMapPin, FiMenu, FiPackage, FiRefreshCw,
  FiSearch, FiSend, FiSettings, FiShield, FiStar, FiUpload, FiX,
} from 'react-icons/fi';
import Logo from '../assets/NexusLogo.png';
import { formatDate, formatMoney } from './clientDashboardModel';
import { emptyFilters, filterProducts, isActive, matchesDelivery, nextStatus, statusLabels, validateProofFile } from './travelerDashboardModel';
import './clientDashboard.css';
import './travelerDashboard.css';

const deliveryFilters = [['all', 'All deliveries'], ['active', 'In progress'], ['proof', 'Proof needed'], ['complete', 'Completed']];
const Status = ({ value }) => <span className={`cd-status cd-status-${value.toLowerCase().replaceAll(' ', '-')}`}><span />{statusLabels[value] || value}</span>;
Status.propTypes = { value: PropTypes.string.isRequired };

const ProductImage = ({ product }) => {
  const [failed, setFailed] = useState(false);
  const src = product.productPhotos?.[0];
  useEffect(() => { setFailed(false); }, [src]);
  return <span className="td-product-image">{src && !failed ? <img src={src} alt="" onError={() => setFailed(true)} /> : <FiPackage aria-hidden="true" />}</span>;
};
ProductImage.propTypes = { product: PropTypes.object.isRequired };

const DeliveryProgress = ({ status }) => {
  const index = { Assigned: 0, Shipped: 1, 'Traveler Confirmed': 2, 'Client Confirmed': 3, Complete: 4, Delivered: 4 }[status];
  if (index === undefined) return null;
  return <ol className="td-progress" aria-label="Delivery progress">{['Accepted', 'Shipped', 'Handed over', 'Client confirmed', 'Proof submitted'].map((label, step) => <li key={label} className={step <= index ? 'is-reached' : ''} aria-current={step === index ? 'step' : undefined}><span>{step <= index ? <FiCheck aria-hidden="true" /> : step + 1}</span>{label}</li>)}</ol>;
};
DeliveryProgress.propTypes = { status: PropTypes.string.isRequired };

const ProofForm = ({ busy, onUpload }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const input = useRef(null);
  return <form className="td-proof" onSubmit={event => {
    event.preventDefault();
    const validation = validateProofFile(file);
    setError(validation);
    if (validation) { input.current?.focus(); return; }
    onUpload(file);
  }}>
    <label htmlFor="delivery-proof"><FiUpload aria-hidden="true" /><strong>Delivery proof</strong><span>JPG, PNG, or PDF · Up to 5 MB</span></label>
    <input id="delivery-proof" ref={input} type="file" accept="image/jpeg,image/png,application/pdf" disabled={busy} aria-invalid={Boolean(error)} aria-describedby={error ? 'proof-file-error' : undefined} onChange={event => {
      const chosen = event.target.files?.[0];
      setFile(chosen || null);
      setError(chosen ? validateProofFile(chosen) : '');
    }} />
    {file && !error && <p className="td-file-name"><FiFile aria-hidden="true" />{file.name}</p>}
    {error && <p className="td-inline-error" id="proof-file-error" role="alert">{error}</p>}
    <button className="cd-button cd-primary" disabled={busy}>{busy ? <><span className="cd-spinner" />Uploading…</> : <><FiUpload aria-hidden="true" />Submit delivery proof</>}</button>
  </form>;
};
ProofForm.propTypes = { busy: PropTypes.bool, onUpload: PropTypes.func.isRequired };

const TravelerDashboardView = ({ user, products, deliveries, earnings, loading = {}, errors = {}, busy, actionError, notice, logoutLoading, onRetry, onNavigate, onClaim, onAdvance, onUpload, onLogout, previewControls }) => {
  const [section, setSection] = useState('discover');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(emptyFilters);
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [sort, setSort] = useState('soonest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menu = useRef(null);
  const menuButton = useRef(null);
  const detailsHeading = useRef(null);
  const listHeading = useRef(null);
  const filterButton = useRef(null);
  const isDiscover = section === 'discover';
  const resource = isDiscover ? 'products' : 'deliveries';
  const source = isDiscover ? products : deliveries;
  const activeFilters = Object.values(filters).filter(value => value !== '').length;
  const visible = useMemo(() => filterProducts(isDiscover ? products : deliveries.filter(product => matchesDelivery(product, deliveryFilter)), { query, filters: isDiscover ? filters : emptyFilters, sort }), [products, deliveries, isDiscover, deliveryFilter, query, filters, sort]);
  const selected = visible.find(product => product.productId === selectedId) || visible[0];
  const destinations = products.map(product => product.destination);
  const choices = values => [...new Set(values.filter(Boolean))].sort();
  const name = user?.name?.trim() || 'Your account';
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';
  const initials = name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const currentError = actionError?.id === selected?.productId ? actionError?.message : '';
  const pending = Boolean(busy);

  useEffect(() => {
    const title = document.title;
    document.title = 'Your journeys | Nexus';
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
  const showSection = value => {
    setSection(value); setQuery(''); setSelectedId(''); setMenuOpen(false);
    requestAnimationFrame(() => { listHeading.current?.focus({ preventScroll: true }); listHeading.current?.scrollIntoView({ block: 'start' }); });
  };
  const selectProduct = id => {
    setSelectedId(id);
    if (window.matchMedia('(max-width: 1180px)').matches) requestAnimationFrame(() => { detailsHeading.current?.focus({ preventScroll: true }); detailsHeading.current?.scrollIntoView({ block: 'start' }); });
  };
  const resetFilters = () => { setQuery(''); setFilters(emptyFilters); setDeliveryFilter('all'); };
  const claim = async product => {
    if (await onClaim(product.productId)) {
      setSection('deliveries'); setDeliveryFilter('all'); setQuery(''); setSelectedId(product.productId);
      requestAnimationFrame(() => detailsHeading.current?.focus({ preventScroll: true }));
    }
  };

  return <div className="nexus-client-dashboard nexus-traveler-dashboard">
    <a className="cd-skip" href="#traveler-main">Skip to dashboard</a>
    {previewControls}
    <div className="cd-layout">
      <aside className="cd-sidebar">
        <div className="cd-brand-row"><button className="cd-brand" onClick={() => navigate('/')} aria-label="Nexus home"><img src={Logo} alt="" width="44" height="44" /><span>NEXUS<span>.</span></span></button><button className="cd-menu-button" ref={menuButton} onClick={() => setMenuOpen(value => !value)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="traveler-navigation">{menuOpen ? <FiX /> : <FiMenu />}</button></div>
        <div className={`cd-sidebar-body ${menuOpen ? 'is-open' : ''}`} id="traveler-navigation" ref={menu}>
          <span className="cd-nav-label">YOUR TRAVEL SPACE</span>
          <nav aria-label="Traveler navigation">
            <button className={isDiscover ? 'is-current' : ''} aria-current={isDiscover ? 'page' : undefined} onClick={() => showSection('discover')}><FiCompass aria-hidden="true" />Find deliveries{isDiscover && <span className="cd-nav-dot" />}</button>
            <button className={!isDiscover ? 'is-current' : ''} aria-current={!isDiscover ? 'page' : undefined} onClick={() => showSection('deliveries')}><FiPackage aria-hidden="true" />My deliveries<span className="cd-nav-count">{loading.deliveries || errors.deliveries ? '—' : deliveries.filter(isActive).length}</span></button>
            <button onClick={() => { setMenuOpen(false); document.querySelector('#traveler-earnings')?.focus(); document.querySelector('#traveler-earnings')?.scrollIntoView({ block: 'center' }); }}><FiDollarSign aria-hidden="true" />Earnings</button>
            <button onClick={() => navigate('/settings?as=traveler', { state: { role: 'traveler' } })}><FiSettings aria-hidden="true" />Settings</button>
          </nav>
          <div className="cd-sidebar-guide"><span><FiCompass aria-hidden="true" /></span><h2>Make room for connection.</h2><p>See how your next journey can bring someone’s order closer.</p><button onClick={() => navigate('/#how-it-works')}>How Nexus works <FiArrowUpRight aria-hidden="true" /></button></div>
          <div className="cd-account"><span className="cd-avatar" aria-hidden="true">{initials}</span><div><strong>{name}</strong><span>Traveler account</span></div><button onClick={onLogout} disabled={logoutLoading || pending} aria-label={logoutLoading ? 'Logging out' : 'Log out'}>{logoutLoading ? <span className="cd-spinner" /> : <FiLogOut aria-hidden="true" />}</button></div>
        </div>
      </aside>
      <main className="cd-main" id="traveler-main" tabIndex={-1}>
        <header className="cd-page-header"><div><span className="cd-eyebrow">YOUR JOURNEY. A LITTLE MORE REWARDING.</span><h1>Welcome back, {firstName}<span>.</span></h1><p>Find a delivery that fits where you’re headed.</p></div><button className="cd-button cd-primary" onClick={() => showSection('deliveries')}><FiPackage aria-hidden="true" />My deliveries</button></header>
        <section className="cd-welcome td-welcome" aria-label="Find your next delivery">
          <div><span className="cd-eyebrow">GOING SOMEWHERE? BRING SOMETHING GOOD.</span><h2>Your next journey.<br /><span>Someone’s happy arrival.</span></h2><p>A little room in your bag. A meaningful connection.<br className="cd-desktop-break" /> Discover orders heading in your direction.</p><button className="cd-text-link" onClick={() => showSection('discover')}>Explore available deliveries <FiArrowUpRight aria-hidden="true" /></button></div>
          <div className="td-journey-art" aria-hidden="true"><div className="td-orbit" /><div className="td-ticket"><span className="td-ticket-heading">NEXUS JOURNEYS <FiSend /></span><div className="td-ticket-route"><span>YOU<small>Your next trip</small></span><FiSend /><span>THEM<small>A happy arrival</small></span></div><div className="td-ticket-bottom"><span>EXTRA SPACE. EXTRA POSSIBILITY.</span><span className="td-ticket-bars" /></div></div><span className="td-floating-parcel"><FiPackage /></span><span className="td-art-note"><FiCheckCircle />Good things travel together.</span></div>
        </section>

        <section className="cd-stats td-stats" aria-label="Traveler summary" id="traveler-earnings" tabIndex={-1}>
          <button className="cd-stat" onClick={() => { setDeliveryFilter('active'); showSection('deliveries'); }}><span className="cd-stat-icon"><FiPackage aria-hidden="true" /></span><span><small>Active deliveries</small><strong>{loading.deliveries || errors.deliveries ? '—' : String(deliveries.filter(isActive).length).padStart(2, '0')}</strong><em>Keep things moving</em></span></button>
          <div className="cd-stat"><span className="cd-stat-icon cd-stat-complete"><FiDollarSign aria-hidden="true" /></span><span><small>Total earnings</small><strong>{loading.earnings || errors.earnings ? '—' : formatMoney(earnings?.totalEarnings)}</strong><em>All time</em></span></div>
          <div className="cd-stat"><span className="cd-stat-icon cd-stat-confirm"><FiClock aria-hidden="true" /></span><span><small>Pending payments</small><strong>{loading.earnings || errors.earnings ? '—' : formatMoney(earnings?.pendingPayments)}</strong><em>Awaiting payment</em></span></div>
          <div className="cd-stat"><span className="cd-stat-icon cd-stat-active"><FiStar aria-hidden="true" /></span><span><small>Traveler rating</small><strong>{loading.earnings || errors.earnings || !Number(earnings?.rating?.count) ? '—' : `${Number(earnings.rating.average).toFixed(1)} / 5`}</strong><em>{loading.earnings || errors.earnings ? 'Not available yet' : Number(earnings?.rating?.count) ? `${earnings.rating.count} reviews` : 'No reviews yet'}</em></span></div>
        </section>
        {errors.earnings && <p className="td-resource-error" role="alert">Earnings are unavailable. <button onClick={onRetry} disabled={pending || loading.earnings}>Try again</button></p>}
        {actionError?.message && !actionError.id && <p className="cd-error" role="alert">{actionError.message}</p>}
        {notice && <p className="cd-notice" role="status">{notice}</p>}

        <div className="td-workspace-tabs" role="group" aria-label="Dashboard view"><button aria-pressed={isDiscover} onClick={() => { setSection('discover'); setQuery(''); }}><FiCompass aria-hidden="true" />Discover deliveries<span>{loading.products || errors.products ? '—' : products.length}</span></button><button aria-pressed={!isDiscover} onClick={() => { setSection('deliveries'); setQuery(''); }}><FiPackage aria-hidden="true" />My deliveries<span>{loading.deliveries || errors.deliveries ? '—' : deliveries.length}</span></button></div>
        <div className="td-content-grid">
          <section className="cd-surface td-list" aria-labelledby="traveler-list-heading">
            <div className="cd-section-heading"><div><h2 id="traveler-list-heading" ref={listHeading} tabIndex={-1}>{isDiscover ? 'A delivery for your direction.' : 'Your deliveries, in motion.'}</h2><p>{isDiscover ? 'Find the right fit for your trip and your bag.' : 'From the first pickup to the final handover.'}</p></div><button className="cd-icon-button" onClick={onRetry} disabled={loading[resource] || pending} aria-label="Refresh deliveries"><FiRefreshCw aria-hidden="true" /></button></div>
            <div className="cd-order-tools td-tools"><label className="cd-search"><FiSearch aria-hidden="true" /><span className="cd-sr-only">Search deliveries</span><input type="search" placeholder="Search a product or destination" value={query} onChange={event => setQuery(event.target.value)} /></label>{isDiscover && <button className="td-filter-button" ref={filterButton} aria-expanded={filtersOpen} aria-controls="traveler-filters" onClick={() => setFiltersOpen(value => !value)}><FiFilter aria-hidden="true" />Filters{activeFilters > 0 && <span>{activeFilters}</span>}</button>}</div>
            {isDiscover && filtersOpen && <div className="td-filter-panel" id="traveler-filters">
              <label>Category<select value={filters.category} onChange={event => setFilters({ ...filters, category: event.target.value })}><option value="">All categories</option>{choices(products.map(product => product.categoryName)).map(value => <option key={value}>{value}</option>)}</select></label>
              <label>Country<select value={filters.country} onChange={event => setFilters({ ...filters, country: event.target.value, state: '', city: '' })}><option value="">Any country</option>{choices(destinations.map(place => place.country)).map(value => <option key={value}>{value}</option>)}</select></label>
              <label>State / region<select value={filters.state} onChange={event => setFilters({ ...filters, state: event.target.value, city: '' })}><option value="">Any region</option>{choices(destinations.filter(place => !filters.country || place.country === filters.country).map(place => place.state)).map(value => <option key={value}>{value}</option>)}</select></label>
              <label>City<select value={filters.city} onChange={event => setFilters({ ...filters, city: event.target.value })}><option value="">Any city</option>{choices(destinations.filter(place => (!filters.country || place.country === filters.country) && (!filters.state || place.state === filters.state)).map(place => place.city)).map(value => <option key={value}>{value}</option>)}</select></label>
              <label>Urgency<select value={filters.urgency} onChange={event => setFilters({ ...filters, urgency: event.target.value })}><option value="">Any urgency</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
              <label>Min product price (KES)<input type="number" min="0" value={filters.priceMin} onChange={event => setFilters({ ...filters, priceMin: event.target.value })} /></label>
              <label>Max product price (KES)<input type="number" min="0" value={filters.priceMax} onChange={event => setFilters({ ...filters, priceMax: event.target.value })} /></label>
              {filters.priceMin !== '' && filters.priceMax !== '' && Number(filters.priceMin) > Number(filters.priceMax) && <p className="td-inline-error">The maximum price must be at least the minimum price.</p>}
              <div className="td-filter-actions"><button onClick={() => setFilters(emptyFilters)}>Clear filters</button><button onClick={() => { setFiltersOpen(false); filterButton.current?.focus(); }}>Done <FiCheck aria-hidden="true" /></button></div>
            </div>}
            {!isDiscover && <div className="cd-filters" role="group" aria-label="Filter my deliveries">{deliveryFilters.map(([key, label]) => <button key={key} aria-pressed={deliveryFilter === key} onClick={() => setDeliveryFilter(key)}>{label}<span>{loading.deliveries || errors.deliveries ? '—' : deliveries.filter(product => matchesDelivery(product, key)).length}</span></button>)}</div>}
            <div className="td-list-meta"><span role="status">{loading[resource] ? 'Loading deliveries…' : errors[resource] ? 'Deliveries unavailable' : `${visible.length} ${visible.length === 1 ? 'delivery' : 'deliveries'}${isDiscover && activeFilters ? ' matching your filters' : ''}`}</span><label><span className="cd-sr-only">Sort deliveries</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="soonest">Due soonest</option><option value="reward">Highest reward</option><option value="newest">Newest first</option></select></label></div>
            {loading[resource] ? <div className="cd-empty" role="status"><span className="cd-spinner" /><h3>Getting journeys ready…</h3><p>Your delivery details will appear here.</p></div> : errors[resource] ? <div className="cd-empty"><span className="cd-empty-icon"><FiRefreshCw aria-hidden="true" /></span><h3>Let’s try that again.</h3><p role="alert">{errors[resource]}</p><button className="cd-button cd-secondary" onClick={onRetry} disabled={pending}>Try again <FiRefreshCw aria-hidden="true" /></button></div> : !visible.length ? <div className="cd-empty"><span className="cd-empty-icon"><FiCompass aria-hidden="true" /></span><h3>{source.length ? 'No matching deliveries.' : isDiscover ? 'More journeys are on the horizon.' : 'Your first delivery starts here.'}</h3><p>{source.length ? 'Try a different destination or clear your filters.' : isDiscover ? 'There are no available deliveries right now. Check again soon.' : 'Explore available orders and choose one that fits your trip.'}</p><button className="cd-button cd-secondary" onClick={source.length ? resetFilters : isDiscover ? onRetry : () => showSection('discover')} disabled={pending}>{source.length ? 'Clear search and filters' : isDiscover ? 'Refresh deliveries' : 'Find a delivery'}<FiArrowUpRight aria-hidden="true" /></button></div> : <ul className="td-product-grid">{visible.map(product => <li key={product.productId}>
              <button className={`td-product-card ${selected?.productId === product.productId ? 'is-selected' : ''}`} aria-pressed={selected?.productId === product.productId} aria-label={`View delivery: ${product.productName}`} onClick={() => selectProduct(product.productId)}>
                <span className="td-card-top"><ProductImage product={product} /><span className={`td-urgency td-urgency-${product.urgencyLevel}`}>{product.urgencyLevel} urgency</span></span>
                <span className="td-category">{product.categoryName}</span><strong className="td-product-name">{product.productName}</strong>
                <span className="td-destination"><FiMapPin aria-hidden="true" />{[product.destination.city, product.destination.country].filter(Boolean).join(', ') || 'Destination unavailable'}</span>
                <span className="td-due"><FiClock aria-hidden="true" />Due {formatDate(product.deliverydate, 'date not set')}</span>
                {!isDiscover && <Status value={product.deliveryStatus} />}
                <span className="td-card-bottom"><span><small>Your reward</small><strong>{formatMoney(product.rewardAmount)}</strong></span><span className="td-card-arrow"><FiArrowUpRight aria-hidden="true" /></span></span>
              </button>
            </li>)}</ul>}
          </section>

          <aside className="cd-surface td-details" aria-labelledby="traveler-details-heading">
            <div className="cd-section-heading"><div><span className="cd-eyebrow">THE DETAILS MAKE THE JOURNEY</span><h2 id="traveler-details-heading" ref={detailsHeading} tabIndex={-1}>Delivery details</h2></div><FiSend aria-hidden="true" /></div>
            {loading[resource] || errors[resource] || !selected ? <div className="cd-details-placeholder"><FiMapPin aria-hidden="true" /><h3>Your next connection.</h3><p>Select a delivery to see its destination, reward, and next steps.</p></div> : <div className="td-detail-body" key={selected.productId}>
              <div className="td-detail-title"><ProductImage product={selected} /><div><span className="td-category">{selected.categoryName}</span><h3>{selected.productName}</h3></div></div>
              <Status value={selected.deliveryStatus} />
              <p className="td-description">{selected.productDescription || 'No additional description provided.'}</p>
              <div className="td-detail-destination"><span><FiMapPin aria-hidden="true" /></span><div><small>Deliver to</small><strong>{[selected.destination.city, selected.destination.state, selected.destination.country].filter(Boolean).filter((value, index, list) => list.indexOf(value) === index).join(', ') || 'Destination unavailable'}</strong><p>Arrive by {formatDate(selected.deliverydate)}</p></div></div>
              <dl className="td-detail-facts"><div><dt>Your reward</dt><dd className="td-reward">{formatMoney(selected.rewardAmount)}</dd></div><div><dt>Product price</dt><dd>{formatMoney(selected.productPrice)}</dd></div><div><dt>Quantity</dt><dd>{selected.quantity ?? 'Not provided'}</dd></div><div><dt>Weight</dt><dd>{selected.productWeight ?? 'Not provided'}</dd></div><div><dt>Dimensions</dt><dd>{selected.productDimensions || 'Not provided'}</dd></div><div><dt>Urgency</dt><dd className="td-capitalize">{selected.urgencyLevel}</dd></div></dl>
              {selected.shippingRestrictions && <p className="td-restrictions"><FiShield aria-hidden="true" /><span><strong>Shipping restrictions</strong>{selected.shippingRestrictions}</span></p>}
              {!isDiscover && <DeliveryProgress status={selected.deliveryStatus} />}
              {currentError && <p className="cd-error" role="alert">{currentError}</p>}
              <div className="td-next-step">
                {isDiscover ? <><h4>A good fit for your trip?</h4><p>Check the destination, arrival date, and item details before accepting this delivery.</p><button className="cd-button cd-primary" disabled={pending || loading.deliveries || Boolean(errors.deliveries)} onClick={() => claim(selected)}>{busy?.id === selected.productId ? <><span className="cd-spinner" />Accepting…</> : <>Accept delivery <FiArrowUpRight aria-hidden="true" /></>}</button>{errors.deliveries && <p className="td-inline-error">Refresh your deliveries before accepting a new one.</p>}</> : selected.proofUploaded ? <><h4>Proof saved. One last step.</h4><p>Finish updating this delivery’s status. Your file does not need to be uploaded again.</p><button className="cd-button cd-primary" disabled={pending} onClick={() => onAdvance(selected.productId)}>{pending ? 'Updating…' : 'Finish delivery'}</button></> : ['Assigned', 'Shipped'].includes(selected.deliveryStatus) ? <><h4>{selected.deliveryStatus === 'Assigned' ? 'Ready for the journey.' : 'At the destination?'}</h4><p>{selected.deliveryStatus === 'Assigned' ? 'Once the item is on its way, update its status so the client can follow along.' : 'Mark the handover only after giving this item to the client. They’ll confirm receipt next.'}</p><button className="cd-button cd-primary" disabled={pending} onClick={() => onAdvance(selected.productId)}>{busy?.id === selected.productId ? <><span className="cd-spinner" />Updating…</> : <><FiCheckCircle aria-hidden="true" />{nextStatus(selected) === 'Shipped' ? 'Mark as shipped' : 'Confirm handover'}</>}</button></> : selected.deliveryStatus === 'Traveler Confirmed' ? <><h4>Over to your client.</h4><p>Waiting for the client to confirm receipt. Refresh your deliveries to check for updates.</p><button className="cd-button cd-secondary" onClick={onRetry} disabled={pending || loading.deliveries}><FiRefreshCw aria-hidden="true" />Check for confirmation</button></> : selected.deliveryStatus === 'Client Confirmed' ? <><h4>They’ve confirmed arrival.</h4><p>Add your delivery proof to complete this journey.</p><ProofForm busy={pending} onUpload={file => onUpload(selected.productId, file)} /></> : selected.deliveryStatus === 'Complete' ? <><span className="td-complete-icon"><FiCheckCircle aria-hidden="true" /></span><h4>Another happy arrival.</h4><p>This delivery is complete. Thank you for making the connection.</p>{selected.clientRating != null ? <p>Client rated: {selected.clientRating}/5</p> : <button className="cd-rating-link" onClick={() => navigate(`/rate-product/${encodeURIComponent(selected.productId)}?as=traveler`, { state: { isTraveler: true } })}><FiStar aria-hidden="true" />Rate your client</button>}</> : <p>{selected.deliveryStatus === 'Cancelled' ? 'This delivery has been cancelled. No further action is needed.' : 'Refresh your deliveries to see the latest status.'}</p>}
              </div>
            </div>}
            <div className="cd-details-footer"><FiShield aria-hidden="true" /><span>A clear handover. A shared confirmation.<br />Every step, together.</span></div>
          </aside>
        </div>
        <footer className="cd-footer"><span>© {new Date().getFullYear()} Nexus</span><span>Good things travel together.</span></footer>
      </main>
    </div>
  </div>;
};

TravelerDashboardView.propTypes = {
  user: PropTypes.object, products: PropTypes.arrayOf(PropTypes.object).isRequired,
  deliveries: PropTypes.arrayOf(PropTypes.object).isRequired, earnings: PropTypes.object,
  loading: PropTypes.object, errors: PropTypes.object, busy: PropTypes.object,
  actionError: PropTypes.object, notice: PropTypes.string, logoutLoading: PropTypes.bool,
  onRetry: PropTypes.func.isRequired, onNavigate: PropTypes.func.isRequired, onClaim: PropTypes.func.isRequired,
  onAdvance: PropTypes.func.isRequired, onUpload: PropTypes.func.isRequired, onLogout: PropTypes.func.isRequired,
  previewControls: PropTypes.node,
};
export default TravelerDashboardView;
