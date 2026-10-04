import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Country from 'country-state-city/lib/country';
import State from 'country-state-city/lib/state';
import { FiArrowLeft, FiArrowRight, FiArrowUpRight, FiCheck, FiCheckCircle, FiCompass, FiGrid, FiLogOut, FiMapPin, FiMenu, FiPackage, FiPlus, FiRefreshCw, FiSend, FiSettings, FiShield, FiShoppingBag, FiX } from 'react-icons/fi';
import Logo from '../assets/NexusLogo.png';
import OrderPhotos from './OrderPhotos';
import { emptyOrderForm, estimateOrder, localDate, validateOrder } from './newOrderModel';
import { formatDate, formatMoney } from './clientDashboardModel';
import './clientDashboard.css';
import './newOrder.css';

const Field = ({ name, label, optional, hint, error, children }) => <div className={`no-field ${error ? 'has-error' : ''}`}><label htmlFor={`order-${name}`}>{label}{optional && <span> (optional)</span>}</label>{children}{hint && <p className="no-field-hint" id={`order-${name}-hint`}>{hint}</p>}{error && <p className="no-field-error" id={`order-${name}-error`}>{error}</p>}</div>;
Field.propTypes = { name: PropTypes.string.isRequired, label: PropTypes.string.isRequired, optional: PropTypes.bool, hint: PropTypes.string, error: PropTypes.string, children: PropTypes.node.isRequired };

const NewOrderView = ({ user, categories, categoryLoading, categoryError, cart, cartLoading, cartError, initialForm, editing, editError, submitting, logoutLoading, onSave, onRetry, onNavigate, onLogout, previewControls, notice }) => {
  const [form, setForm] = useState(initialForm || emptyOrderForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(null);
  const [processingPhotos, setProcessingPhotos] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cities, setCities] = useState([]);
  const menu = useRef(null);
  const menuButton = useRef(null);
  const formRef = useRef(null);
  const confirmation = useRef(null);
  const errorSummary = useRef(null);
  const saveLock = useRef(false);
  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => State.getStatesOfCountry(form.country), [form.country]);
  const countryName = Country.getCountryByCode(form.country)?.name || form.country;
  const stateName = State.getStateByCodeAndCountry(form.state, form.country)?.name || form.state;
  const estimate = estimateOrder(form.productPrice, form.quantity);
  const name = user?.name || 'Your account';
  const busy = submitting || processingPhotos;
  const cartCount = cart.reduce((count, item) => count + (Number(item.quantity) || 0), 0);
  const cartTotal = cart.reduce((total, item) => total + (Number(item.finalCharge) || 0), 0);

  useEffect(() => {
    if (initialForm) setForm(initialForm);
  }, [initialForm]);
  useEffect(() => {
    const title = document.title;
    document.title = `${editing ? 'Edit your item' : 'Create an order'} | Nexus`;
    return () => { document.title = title; };
  }, [editing]);
  useEffect(() => {
    let cancelled = false;
    setCities([]);
    if (form.country && form.state) {
      // City suggestions are optional; the large dataset is loaded only when needed.
      import('country-state-city/lib/city').then(({ default: City }) => {
        if (!cancelled) setCities(City.getCitiesOfState(form.country, form.state));
      }).catch(() => { /* A city can always be entered manually. */ });
    }
    return () => { cancelled = true; };
  }, [form.country, form.state]);
  useEffect(() => {
    if (!menuOpen) return;
    menu.current?.querySelector('button')?.focus();
    const escape = event => { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); } };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [menuOpen]);
  useEffect(() => {
    if (saved) { confirmation.current?.focus(); confirmation.current?.scrollIntoView({ block: 'center' }); }
  }, [saved]);

  const change = (key, value) => {
    setForm(previous => ({ ...previous, [key]: value, ...(key === 'country' ? { state: '', city: '' } : key === 'state' ? { city: '' } : {}) }));
    setFieldErrors(previous => ({ ...previous, [key]: '' }));
    setSaveError('');
  };
  const inputProps = (key, hint = false) => ({
    id: `order-${key}`, name: key, value: form[key], onChange: event => change(key, event.target.value),
    'aria-invalid': Boolean(fieldErrors[key]),
    'aria-describedby': [hint && `order-${key}-hint`, fieldErrors[key] && `order-${key}-error`].filter(Boolean).join(' ') || undefined,
  });
  const navigate = (path, options) => { setMenuOpen(false); onNavigate(path, options); };
  const submit = async event => {
    event.preventDefault();
    if (busy || saveLock.current) return;
    const errors = validateOrder(form, { original: editing ? initialForm : null });
    setFieldErrors(errors); setSaveError('');
    if (Object.keys(errors).length) {
      requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    saveLock.current = true;
    try {
      const result = await onSave(form);
      if (result.ok) setSaved({ name: form.productName.trim(), quantity: Number(form.quantity), total: estimate?.total });
      else {
        setSaveError(result.message || 'We couldn’t save this item. Your details are still here. Please try again.');
        if (result.categoryId) setForm(previous => ({ ...previous, productCategory: result.categoryId, customCategory: '' }));
        requestAnimationFrame(() => errorSummary.current?.focus());
      }
    } finally { saveLock.current = false; }
  };
  const addAnother = () => {
    setSaved(null); setForm(emptyOrderForm); setFieldErrors({}); setSaveError('');
    requestAnimationFrame(() => document.querySelector('#order-productName')?.focus());
  };

  return <div className="nexus-client-dashboard nexus-new-order">
    <a className="cd-skip" href="#new-order-main">Skip to order form</a>{previewControls}
    <div className="cd-layout">
      <aside className="cd-sidebar">
        <div className="cd-brand-row"><button className="cd-brand" onClick={() => navigate('/')} aria-label="Nexus home"><img src={Logo} alt="" width="44" height="44" /><span>NEXUS<span>.</span></span></button><button className="cd-menu-button" ref={menuButton} onClick={() => setMenuOpen(value => !value)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="order-navigation">{menuOpen ? <FiX /> : <FiMenu />}</button></div>
        <div className={`cd-sidebar-body ${menuOpen ? 'is-open' : ''}`} id="order-navigation" ref={menu}>
          <span className="cd-nav-label">YOUR WORKSPACE</span>
          <nav aria-label="Client navigation"><button onClick={() => navigate('/client-dashboard')}><FiGrid aria-hidden="true" />Overview</button><button className="is-current" aria-current="page" onClick={() => { setMenuOpen(false); document.querySelector('#new-order-heading')?.focus(); document.querySelector('#new-order-heading')?.scrollIntoView(); }}><FiPlus aria-hidden="true" />{editing ? 'Edit item' : 'Create an order'}<span className="cd-nav-dot" /></button><button onClick={() => navigate('/cart')}><FiShoppingBag aria-hidden="true" />My cart<span className="cd-nav-count">{cartLoading || cartError ? '—' : cartCount}</span></button><button onClick={() => navigate('/settings?as=client', { state: { role: 'client' } })}><FiSettings aria-hidden="true" />Settings</button></nav>
          <div className="cd-sidebar-guide"><span><FiCompass aria-hidden="true" /></span><h2>A good journey starts here.</h2><p>A few clear details help your traveler find exactly what you need.</p><button onClick={() => navigate('/#how-it-works')}>How Nexus works <FiArrowUpRight aria-hidden="true" /></button></div>
          <div className="cd-account"><span className="cd-avatar" aria-hidden="true">{name.split(/\s+/).slice(0, 2).map(part => part[0]).join('')}</span><div><strong>{name}</strong><span>Client account</span></div><button onClick={onLogout} disabled={logoutLoading || busy} aria-label={logoutLoading ? 'Logging out' : 'Log out'}>{logoutLoading ? <span className="cd-spinner" /> : <FiLogOut aria-hidden="true" />}</button></div>
        </div>
      </aside>
      <main className="cd-main" id="new-order-main" tabIndex={-1}>
        <div className="no-breadcrumb"><button onClick={() => navigate('/client-dashboard')}><FiArrowLeft aria-hidden="true" />Your dashboard</button><span>/</span><span>{editing ? 'Edit item' : 'Create an order'}</span></div>
        <header className="cd-page-header"><div><span className="cd-eyebrow">A LITTLE CLOSER TO WHAT YOU LOVE</span><h1 id="new-order-heading" tabIndex={-1}>{editing ? 'Make it just right' : 'What’s on your wish list'}<span>?</span></h1><p>{editing ? 'Update your item’s details before continuing to checkout.' : 'Tell us what you need. We’ll help bring it closer.'}</p></div><button className="cd-button cd-secondary" onClick={() => navigate('/cart')}><FiShoppingBag aria-hidden="true" />View cart{!cartLoading && !cartError && <span className="no-cart-count">{cartCount}</span>}</button></header>
        <ol className="no-steps" aria-label="Order process"><li aria-current="step"><span>01</span><div><strong>Your item</strong><small>Tell us the details</small></div></li><li><span>02</span><div><strong>Review your cart</strong><small>Make sure it’s right</small></div></li><li><span>03</span><div><strong>Checkout</strong><small>Complete your order</small></div></li></ol>
        {notice && <p className="cd-notice" role="status">{notice}</p>}
        {saved ? <section className="no-success cd-surface" ref={confirmation} tabIndex={-1} aria-labelledby="order-saved-heading"><span className="no-success-icon"><FiCheckCircle aria-hidden="true" /></span><span className="cd-eyebrow">ONE STEP CLOSER</span><h2 id="order-saved-heading">{editing ? 'Your item is updated.' : 'A good find. Added to your cart.'}</h2><p><strong>{saved.name}</strong> · Quantity {saved.quantity}</p><p className="no-success-total">{formatMoney(saved.total)}</p><p>Review your cart when you’re ready to continue.</p><div><button className="cd-button cd-primary" onClick={() => navigate('/cart')}>Review your cart <FiArrowRight aria-hidden="true" /></button>{!editing && <button className="cd-button cd-secondary" onClick={addAnother}><FiPlus aria-hidden="true" />Add another item</button>}</div></section> : editing && !initialForm ? <section className="cd-surface cd-empty">{editError ? <><h2>We couldn’t load this item.</h2><p role="alert">{editError}</p><button className="cd-button cd-secondary" onClick={() => onRetry('edit')}>Try again <FiRefreshCw aria-hidden="true" /></button></> : <><span className="cd-spinner" /><p role="status">Loading your item’s details…</p></>}</section> : <div className="no-grid">
          <form id="new-order-form" ref={formRef} onSubmit={submit} noValidate>
            {saveError && <p className="cd-error" role="alert" tabIndex={-1} ref={errorSummary}>{saveError}</p>}
            {Object.values(fieldErrors).some(Boolean) && <p className="no-validation-summary" role="alert">Check the highlighted fields before continuing.</p>}
            <fieldset disabled={busy} className="no-form-fields">
              <section className="cd-surface no-form-section" aria-labelledby="product-section-heading"><div className="no-section-heading"><span><FiPackage aria-hidden="true" /></span><div><h2 id="product-section-heading">First, the good stuff.</h2><p>Your product details. All fields are required unless marked optional.</p></div><small>01</small></div><div className="no-section-body">
                {editing && <p className="no-edit-note">Quantity, category, and photos stay as originally added. You can update the other details below.</p>}
                <div className="no-row no-name-row"><Field name="productName" label="Product name" error={fieldErrors.productName}><input {...inputProps('productName')} required maxLength={160} placeholder="e.g. Sony WH-1000XM5 headphones" autoComplete="off" /></Field><Field name="quantity" label="Quantity" error={fieldErrors.quantity}><input {...inputProps('quantity')} type="number" min="1" step="1" required disabled={editing} inputMode="numeric" /></Field></div>
                <Field name="productDescription" label="Product description" hint="Include the brand, model, size, color, or anything your traveler should know." error={fieldErrors.productDescription}><textarea {...inputProps('productDescription', true)} required maxLength={2000} rows={3} placeholder="The details that make it the right one…" /></Field>
                <div className="no-row"><Field name="productCategory" label="Category" error={fieldErrors.productCategory}><select {...inputProps('productCategory')} required disabled={categoryLoading || editing}><option value="">{categoryLoading ? 'Loading categories…' : 'Choose a category'}</option>{categories.map(category => <option key={category._id} value={category._id}>{category.categoryName}</option>)}{form.productCategory && form.productCategory !== 'custom' && !categories.some(category => category._id === form.productCategory) && <option value={form.productCategory}>{form.productCategoryName || 'Saved category'}</option>}<option value="custom">Add a new category</option></select></Field>{form.productCategory === 'custom' && <Field name="customCategory" label="New category name" error={fieldErrors.customCategory}><input {...inputProps('customCategory')} required maxLength={80} placeholder="e.g. Home essentials" /></Field>}</div>
                {categoryError && <p className="no-resource-error" role="alert">{categoryError} <button type="button" onClick={() => onRetry('categories')}>Retry categories</button></p>}
                <OrderPhotos photos={form.photos} onChange={photos => change('photos', photos)} disabled={busy} readOnly={editing} onProcessing={setProcessingPhotos} />
                <div className="no-row"><Field name="weight" label="Weight" optional error={fieldErrors.weight}><input {...inputProps('weight')} type="number" min="0.01" step="any" placeholder="e.g. 0.5" /></Field><Field name="dimensions" label="Dimensions" optional error={fieldErrors.dimensions}><input {...inputProps('dimensions')} maxLength={120} placeholder="e.g. 20 × 15 × 8 cm" /></Field></div>
              </div></section>
              <section className="cd-surface no-form-section" aria-labelledby="destination-section-heading"><div className="no-section-heading"><span><FiMapPin aria-hidden="true" /></span><div><h2 id="destination-section-heading">Where should it find you?</h2><p>Choose the destination and when you’d like it to arrive.</p></div><small>02</small></div><div className="no-section-body">
                <div className="no-row"><Field name="country" label="Country" error={fieldErrors.country}><select {...inputProps('country')} required autoComplete="country"><option value="">Choose a country</option>{countries.map(country => <option value={country.isoCode} key={country.isoCode}>{country.name}</option>)}{form.country && !countries.some(country => country.isoCode === form.country) && <option value={form.country}>{form.country}</option>}</select></Field><Field name="state" label="State / region" error={fieldErrors.state}>{states.length ? <select {...inputProps('state')} required autoComplete="address-level1"><option value="">Choose a region</option>{states.map(state => <option value={state.isoCode} key={state.isoCode}>{state.name}</option>)}{form.state && !states.some(state => state.isoCode === form.state) && <option value={form.state}>{form.state}</option>}</select> : <input {...inputProps('state')} required disabled={!form.country} autoComplete="address-level1" maxLength={120} placeholder={form.country ? 'Enter your state or region' : 'Choose a country first'} />}</Field></div>
                <div className="no-row"><Field name="city" label="City" error={fieldErrors.city}><input {...inputProps('city')} required list="order-city-suggestions" disabled={!form.state} autoComplete="address-level2" maxLength={120} placeholder={form.state ? 'Enter or choose a city' : 'Choose a region first'} /><datalist id="order-city-suggestions">{cities.map(city => <option value={city.name} key={`${city.name}-${city.latitude}-${city.longitude}`} />)}</datalist></Field><Field name="deliveryDate" label="Arrive by" error={fieldErrors.deliveryDate}><input {...inputProps('deliveryDate')} type="date" min={editing && initialForm?.deliveryDate < localDate() ? initialForm.deliveryDate : localDate()} required /></Field></div>
                <Field name="urgencyLevel" label="Delivery priority" hint="Let travelers know how time-sensitive your request is." error={fieldErrors.urgencyLevel}><select {...inputProps('urgencyLevel', true)} required><option value="low">Low — I’m flexible</option><option value="medium">Medium — Within my chosen date</option><option value="high">High — Time-sensitive</option></select></Field>
                <Field name="shippingRestrictions" label="Shipping notes or restrictions" optional error={fieldErrors.shippingRestrictions}><textarea {...inputProps('shippingRestrictions')} rows={2} maxLength={1000} placeholder="e.g. Fragile item. Keep in its original packaging." /></Field>
              </div></section>
              <section className="cd-surface no-form-section" aria-labelledby="price-section-heading"><div className="no-section-heading"><span><FiShoppingBag aria-hidden="true" /></span><div><h2 id="price-section-heading">Let’s put a price on it.</h2><p>Enter the product price for one item, in Kenyan shillings.</p></div><small>03</small></div><div className="no-section-body"><Field name="productPrice" label="Price per item (KES)" hint="The 15% service fee is calculated in your order summary." error={fieldErrors.productPrice}><div className="no-money-input"><span aria-hidden="true">KES</span><input {...inputProps('productPrice', true)} type="number" min="0.01" step="0.01" inputMode="decimal" required placeholder="0.00" /></div></Field></div></section>
            </fieldset>
            <div className="no-form-actions"><button className="cd-button cd-secondary" type="button" disabled={busy} onClick={() => navigate('/client-dashboard')}><FiArrowLeft aria-hidden="true" />Back to dashboard</button><button className="cd-button cd-primary" type="submit" disabled={busy || categoryLoading}>{submitting ? <><span className="cd-spinner" />Saving your item…</> : processingPhotos ? 'Preparing photos…' : <>{editing ? 'Save changes' : 'Add to cart'}<FiArrowRight aria-hidden="true" /></>}</button></div>
          </form>
          <aside className="no-summary-column">
            <section className="no-summary cd-surface" aria-labelledby="order-summary-heading"><div className="no-summary-hero"><span className="cd-eyebrow">GOOD THINGS START SMALL</span><div className="no-parcel-art" aria-hidden="true"><span><FiPackage /></span><i><FiSend /></i><small>YOUR NEXT HAPPY ARRIVAL</small></div><h2 id="order-summary-heading">Your order, at a glance.</h2><p>A few details. A new connection.</p></div><div className="no-summary-body"><div className="no-summary-product"><strong>{form.productName || 'Your next good find'}</strong><span>Quantity: {form.quantity || '—'}</span></div><div className="no-summary-destination"><FiMapPin aria-hidden="true" /><div><small>Deliver to</small><strong>{[form.city, stateName, countryName].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(', ') || 'Choose a destination'}</strong><span>{form.deliveryDate ? `Arrive by ${formatDate(form.deliveryDate)}` : 'Set your arrival date'}</span></div></div><dl className="no-price-breakdown"><div><dt>Product subtotal{Number(form.quantity) > 1 ? ` (${form.quantity} items)` : ''}</dt><dd>{formatMoney(estimate?.subtotal)}</dd></div><div><dt>Service fee <span>15%</span></dt><dd>{formatMoney(estimate?.serviceFee)}</dd></div><div className="no-price-total"><dt>Item total</dt><dd><output aria-live="polite">{formatMoney(estimate?.total)}</output></dd></div></dl><p className="no-summary-note"><FiShield aria-hidden="true" />Adding to your cart doesn’t charge you. Review your items before checkout.</p></div></section>
            <section className="no-cart-preview cd-surface" aria-labelledby="order-cart-heading"><div><h2 id="order-cart-heading"><FiShoppingBag aria-hidden="true" />Already in your cart</h2>{!cartLoading && !cartError && <span>{cartCount}</span>}</div>{cartLoading ? <p role="status">Loading your cart…</p> : cartError ? <p className="no-resource-error" role="alert">{cartError} <button onClick={() => onRetry('cart')}>Retry cart</button></p> : cart.length ? <><ul>{cart.slice(0, 3).map(item => <li key={item.productId || item.productName}><span>{item.productName}<small>Quantity {item.quantity}</small></span><strong>{formatMoney(item.finalCharge)}</strong></li>)}</ul>{cart.length > 3 && <p>+ {cart.length - 3} more {cart.length - 3 === 1 ? 'item' : 'items'}</p>}<div className="no-cart-total"><span>Current cart total</span><strong>{formatMoney(cartTotal)}</strong></div></> : <p>Your cart is waiting for a good find. Add your first item to get started.</p>}<button className="cd-text-link" onClick={() => navigate('/cart')}>View your cart <FiArrowUpRight aria-hidden="true" /></button></section>
            <p className="no-help-note"><FiCheck aria-hidden="true" />Clear descriptions help travelers bring the right item.</p>
          </aside>
        </div>}
        <footer className="cd-footer"><span>© {new Date().getFullYear()} Nexus</span><span>Good things travel together.</span></footer>
      </main>
    </div>
  </div>;
};

NewOrderView.propTypes = {
  user: PropTypes.object, categories: PropTypes.arrayOf(PropTypes.object).isRequired, categoryLoading: PropTypes.bool,
  categoryError: PropTypes.string, cart: PropTypes.arrayOf(PropTypes.object).isRequired, cartLoading: PropTypes.bool,
  cartError: PropTypes.string, initialForm: PropTypes.object, editing: PropTypes.bool, editError: PropTypes.string,
  submitting: PropTypes.bool, logoutLoading: PropTypes.bool, onSave: PropTypes.func.isRequired,
  onRetry: PropTypes.func.isRequired, onNavigate: PropTypes.func.isRequired, onLogout: PropTypes.func.isRequired,
  previewControls: PropTypes.node, notice: PropTypes.string,
};
export default NewOrderView;
