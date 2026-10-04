import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FiArrowLeft, FiArrowUpRight, FiCheck, FiCheckCircle, FiCompass, FiGrid, FiLock, FiLogOut, FiMail, FiMenu, FiPhone, FiPlus, FiRefreshCw, FiSettings, FiShield, FiShoppingBag, FiUser, FiX } from 'react-icons/fi';
import Logo from '../assets/NexusLogo.png';
import { profileChanges, profileForm, validateProfile } from './settingsModel';
import './clientDashboard.css';
import './settings.css';

const Avatar = ({ profile, className = '' }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [profile?.avatar]);
  return <span className={`st-avatar ${className}`} aria-hidden="true">{profile?.avatar && !failed ? <img src={profile.avatar} alt="" onError={() => setFailed(true)} /> : profile?.name ? profile.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('') : <FiUser />}</span>;
};
Avatar.propTypes = { profile: PropTypes.object, className: PropTypes.string };

const ProfileForm = ({ profile, busy, saving, onSave, onEdit }) => {
  const [form, setForm] = useState(() => profileForm(profile)), [errors, setErrors] = useState({});
  const formRef = useRef(null);
  useEffect(() => { setForm(profileForm(profile)); setErrors({}); }, [profile]);
  const dirty = Boolean(Object.keys(profileChanges(form, profile)).length);
  const change = event => { const { name, value } = event.target; setForm(previous => ({ ...previous, [name]: value })); setErrors(previous => ({ ...previous, [name]: '' })); onEdit(); };
  const submit = event => {
    event.preventDefault(); if (busy || !dirty) return;
    const errors = validateProfile(form, profile); setErrors(errors);
    const first = Object.keys(errors)[0];
    if (first) { formRef.current?.elements.namedItem(first)?.focus(); return; }
    onSave(form);
  };
  return <section className="st-profile cd-surface" aria-labelledby="settings-profile-heading" id="settings-profile">
    <div className="st-section-heading"><span className="st-section-icon"><FiUser aria-hidden="true" /></span><div><span className="cd-eyebrow">THE DETAILS THAT MAKE YOU, YOU</span><h2 id="settings-profile-heading" tabIndex={-1}>Personal information.</h2><p>Keep your name and contact number up to date.</p></div></div>
    <form ref={formRef} onSubmit={submit} noValidate aria-busy={saving}>
      <div className="st-fields">{[{ name: 'name', label: 'Full name', placeholder: 'Your full name', icon: FiUser, type: 'text', autoComplete: 'name' }, { name: 'phone_number', label: 'Phone number', placeholder: 'e.g. +254 712 345 678', icon: FiPhone, type: 'tel', autoComplete: 'tel' }].map(({ name, label, placeholder, icon: Icon, type, autoComplete }) => <div className="st-field" key={name}><label htmlFor={`settings-${name}`}>{label}{name === 'phone_number' && !profile.phone_number && <span>Optional</span>}</label><div className={`st-input ${errors[name] ? 'has-error' : ''}`}><Icon aria-hidden="true" /><input id={`settings-${name}`} name={name} type={type} value={form[name]} onChange={change} placeholder={placeholder} autoComplete={autoComplete} disabled={busy} required={name === 'name'} maxLength={name === 'name' ? 100 : 40} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `settings-${name}-error` : name === 'phone_number' ? 'settings-phone-help' : undefined} /></div>{errors[name] && <p id={`settings-${name}-error`} className="st-field-error" role="alert">{errors[name]}</p>}{name === 'phone_number' && <p className="st-field-help" id="settings-phone-help">Use a number where you can be reached.</p>}</div>)}</div>
      <div className="st-field st-email-field"><label htmlFor="settings-email">Email address<span><FiLock aria-hidden="true" />Read only</span></label><div className="st-input is-readonly"><FiMail aria-hidden="true" /><input id="settings-email" type="email" value={profile.email} placeholder="Email unavailable" readOnly aria-describedby="settings-email-help" /></div><p className="st-field-help" id="settings-email-help">Your sign-in email. Changing it isn’t available here.</p></div>
      <div className="st-form-footer"><span className={dirty ? 'has-changes' : ''}><span />{saving ? 'Saving your changes…' : dirty ? 'You have unsaved changes' : 'No unsaved changes'}</span><div><button type="button" className="st-discard" disabled={busy || !dirty} onClick={() => { setForm(profileForm(profile)); setErrors({}); onEdit(); }}>Discard changes</button><button className="cd-button cd-primary" type="submit" disabled={busy || !dirty}>{saving ? <><span className="cd-spinner" />Saving…</> : <><FiCheck aria-hidden="true" />Save changes</>}</button></div></div>
    </form>
  </section>;
};
ProfileForm.propTypes = { profile: PropTypes.object.isRequired, busy: PropTypes.bool, saving: PropTypes.bool, onSave: PropTypes.func.isRequired, onEdit: PropTypes.func.isRequired };

const SettingsView = ({ role, profile, phase, saving, loggingOut, error, notice, onSave, onEdit, onRetry, onLogout, onNavigate, previewControls }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menu = useRef(null), menuButton = useRef(null), feedback = useRef(null);
  const workspace = role === 'client' ? 'Client workspace' : role === 'traveler' ? 'Traveler workspace' : 'Your account';
  const ready = phase === 'ready' && profile, busy = saving || loggingOut;
  const verification = profile?.isVerified === true ? 'Verified' : profile?.isVerified === false ? 'Not verified' : 'Status unavailable';
  useEffect(() => { const title = document.title; document.title = 'Account settings | Nexus'; return () => { document.title = title; }; }, []);
  useEffect(() => { if (notice || error) feedback.current?.focus(); }, [notice, error]);
  useEffect(() => {
    if (!menuOpen) return;
    menu.current?.querySelector('button')?.focus();
    const escape = event => { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); } };
    window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape);
  }, [menuOpen]);
  const navigate = path => { if (!busy) { setMenuOpen(false); onNavigate(path); } };
  const jump = id => { const target = document.getElementById(id); target?.focus(); target?.scrollIntoView({ block: 'start', behavior: 'instant' }); };
  return <div className="nexus-client-dashboard nexus-settings">
    <a className="cd-skip" href="#settings-main">Skip to account settings</a>{previewControls}
    <div className="cd-layout">
      <aside className="cd-sidebar"><div className="cd-brand-row"><button className="cd-brand" disabled={busy} onClick={() => navigate('/')} aria-label="Nexus home"><img src={Logo} alt="" width="44" height="44" /><span>NEXUS<span>.</span></span></button><button className="cd-menu-button" ref={menuButton} onClick={() => setMenuOpen(value => !value)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="settings-navigation">{menuOpen ? <FiX /> : <FiMenu />}</button></div>
        <div className={`cd-sidebar-body ${menuOpen ? 'is-open' : ''}`} id="settings-navigation" ref={menu}><span className="cd-nav-label">YOUR WORKSPACE</span><nav aria-label="Workspace navigation">
          {role !== 'traveler' && <button disabled={busy} onClick={() => navigate('/client-dashboard')}><FiGrid aria-hidden="true" />{role ? 'Overview' : 'Client dashboard'}</button>}
          {role !== 'client' && <button disabled={busy} onClick={() => navigate('/traveler-dashboard')}><FiCompass aria-hidden="true" />{role ? 'Your deliveries' : 'Traveler dashboard'}</button>}
          {role === 'client' && <><button disabled={busy} onClick={() => navigate('/new-order')}><FiPlus aria-hidden="true" />Create an order</button><button disabled={busy} onClick={() => navigate('/cart')}><FiShoppingBag aria-hidden="true" />My cart</button></>}
          <button className="is-current" aria-current="page" onClick={() => { setMenuOpen(false); jump('settings-heading'); }}><FiSettings aria-hidden="true" />Settings</button>
        </nav><div className="cd-sidebar-guide"><span><FiUser aria-hidden="true" /></span><h2>A familiar face.<br />A smoother journey.</h2><p>Your profile brings your details together, wherever you’re headed.</p><button disabled={busy} onClick={() => navigate('/#how-it-works')}>How Nexus works<FiArrowUpRight aria-hidden="true" /></button></div><div className="cd-account"><Avatar profile={ready ? profile : null} /><div><strong>{ready ? profile.name || 'Your account' : 'Your account'}</strong><span>{workspace}</span></div><button onClick={onLogout} disabled={busy} aria-label={loggingOut ? 'Signing out' : 'Sign out'}>{loggingOut ? <span className="cd-spinner" /> : <FiLogOut aria-hidden="true" />}</button></div></div>
      </aside>
      <main className="cd-main" id="settings-main" tabIndex={-1}>
        <header className="cd-page-header"><div><span className="cd-eyebrow">YOUR ACCOUNT, A LITTLE MORE YOU</span><h1 id="settings-heading" tabIndex={-1}>Your space, your details<span>.</span></h1><p>Keep the essentials close, and your next connection simple.</p></div>{role && <button className="cd-button cd-secondary" disabled={busy} onClick={() => navigate(role === 'traveler' ? '/traveler-dashboard' : '/client-dashboard')}><FiArrowLeft aria-hidden="true" />Your dashboard</button>}</header>
        {!ready ? <section className="cd-surface cd-empty st-page-state">{phase === 'loading' ? <><span className="cd-spinner" /><h2>Getting your details together…</h2><p role="status">Your account settings will be ready in a moment.</p></> : <><span className="cd-empty-icon"><FiUser aria-hidden="true" /></span><h2>Let’s try that again.</h2><p role="alert">We couldn’t load your account details. Please try again.</p><button className="cd-button cd-primary" onClick={onRetry}>Try again<FiRefreshCw aria-hidden="true" /></button></>}</section> : <>
          <section className="st-profile-banner" aria-label="Your saved profile"><div className="st-banner-person"><Avatar profile={profile} className="st-avatar-large" /><div><span className="cd-eyebrow">GOOD CONNECTIONS START WITH YOU</span><h2>{profile.name || 'Make yourself at home.'}</h2><p>{profile.email || 'Email unavailable'}</p><span className="st-workspace-badge"><FiCompass aria-hidden="true" />{workspace}</span></div></div><div className="st-banner-art" aria-hidden="true"><span className="st-art-orbit" /><span className="st-art-user"><FiUser /></span><span className="st-art-detail"><FiCheck />The details matter.</span></div></section>
          <nav className="st-section-nav" aria-label="Settings sections"><a href="#settings-profile-heading" onClick={event => { event.preventDefault(); jump('settings-profile-heading'); }}><FiUser aria-hidden="true" />Personal information</a><a href="#settings-security-heading" onClick={event => { event.preventDefault(); jump('settings-security-heading'); }}><FiShield aria-hidden="true" />Sign-in & security</a></nav>
          {(error || notice) && <p className={error ? 'cd-error st-feedback' : 'cd-notice st-feedback'} ref={feedback} tabIndex={-1} role={error ? 'alert' : 'status'}>{error || notice}</p>}
          <div className="st-grid"><div className="st-main-column"><ProfileForm profile={profile} busy={busy} saving={saving} onSave={onSave} onEdit={onEdit} />
            <section className="st-security cd-surface" aria-labelledby="settings-security-heading"><div className="st-section-heading"><span className="st-section-icon"><FiShield aria-hidden="true" /></span><div><span className="cd-eyebrow">A LITTLE PEACE OF MIND</span><h2 id="settings-security-heading" tabIndex={-1}>Sign-in & security.</h2><p>Your email verification and sign-in options.</p></div></div><div className="st-security-rows">
              <div><span className="st-security-icon"><FiMail aria-hidden="true" /></span><div><h3>Email verification</h3><p>{profile.isVerified === true ? 'Your email address has been verified.' : profile.isVerified === false ? 'Your email address is not marked as verified.' : 'Email verification status is unavailable.'}</p></div><span className="st-status">{verification}</span></div>
              <div><span className="st-security-icon"><FiLock aria-hidden="true" /></span><div><h3>Password</h3><p>Changing your password isn’t available in settings yet.</p></div><span className="st-status is-unavailable">Unavailable</span></div>
              <div><span className="st-security-icon"><FiShield aria-hidden="true" /></span><div><h3>Authenticator app</h3><p>Authenticator setup isn’t available here yet.</p></div><span className="st-status is-unavailable">Unavailable</span></div>
            </div></section>
          </div><aside className="st-aside"><section className="st-account-card cd-surface" aria-labelledby="settings-overview-heading"><div className="st-card-heading"><span className="cd-eyebrow">THE ESSENTIALS, TOGETHER</span><h2 id="settings-overview-heading">Your account<br />at a glance.</h2><FiCompass aria-hidden="true" /></div><dl><div><dt><FiMail aria-hidden="true" />Email</dt><dd>{profile.email || 'Not provided'}</dd></div><div><dt><FiPhone aria-hidden="true" />Contact number</dt><dd>{profile.phone_number || 'Not added yet'}</dd></div><div><dt><FiCheckCircle aria-hidden="true" />Email verification</dt><dd>{verification}</dd></div></dl><div className="st-account-note"><FiUser aria-hidden="true" /><p>These are your saved details. Update your personal information to keep them current.</p></div></section>
            <section className="st-signout" aria-labelledby="settings-signout-heading"><span className="st-section-icon"><FiLogOut aria-hidden="true" /></span><h2 id="settings-signout-heading">Done for now?</h2><p>Sign out of Nexus on this browser. You’ll return to the sign-in page.</p><button className="cd-button cd-secondary" disabled={busy} onClick={onLogout}>{loggingOut ? <><span className="cd-spinner" />Signing out…</> : <>Sign out of Nexus<FiArrowUpRight aria-hidden="true" /></>}</button></section>
          </aside></div>
        </>}
        <footer className="cd-footer"><span>© {new Date().getFullYear()} Nexus</span><span>Good things travel together.</span></footer>
      </main>
    </div>
  </div>;
};
SettingsView.propTypes = { role: PropTypes.string.isRequired, profile: PropTypes.object, phase: PropTypes.string.isRequired, saving: PropTypes.bool, loggingOut: PropTypes.bool, error: PropTypes.string, notice: PropTypes.string, onSave: PropTypes.func.isRequired, onEdit: PropTypes.func.isRequired, onRetry: PropTypes.func.isRequired, onLogout: PropTypes.func.isRequired, onNavigate: PropTypes.func.isRequired, previewControls: PropTypes.node };
export default SettingsView;
