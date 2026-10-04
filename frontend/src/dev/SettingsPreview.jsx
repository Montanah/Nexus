import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SettingsView from '../Components/SettingsView';
import { profilePayload, validateProfile } from '../Components/settingsModel';

const SettingsPreviewScreen = ({ location }) => {
  const navigate = useNavigate();
  const role = new URLSearchParams(location.search).get('as') === 'traveler' ? 'traveler' : 'client';
  const [base] = useState(() => ({ _id: 'sample-settings-user', name: role === 'traveler' ? 'Jordan Lee' : 'Alex Morgan', email: role === 'traveler' ? 'jordan@example.test' : 'alex@example.test', phone_number: '+254 700 000 000', avatar: '', isVerified: true, ...location.state?.previewUser }));
  const [profile, setProfile] = useState(() => ({ ...base }));
  const [scenario, setScenario] = useState('sample'), [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false), [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const pending = useRef(null), failSave = useRef(false), failLogout = useRef(false);
  useEffect(() => () => clearTimeout(pending.current), []);
  const reset = (next = 'sample') => {
    clearTimeout(pending.current); pending.current = null;
    setScenario(next); setRevision(value => value + 1); setSaving(false); setLoggingOut(false); setError(''); setNotice('');
    failSave.current = next === 'save-error'; failLogout.current = next === 'signout-error';
    setProfile({ ...base, ...(next === 'unverified' ? { isVerified: false } : {}), ...(next === 'missing' ? { name: '', phone_number: '', avatar: '', isVerified: undefined } : {}), ...(next === 'avatar-error' ? { avatar: '/sample-missing-profile-image.png' } : {}) });
  };
  const save = form => {
    if (pending.current || Object.keys(validateProfile(form, profile)).length) return;
    const payload = profilePayload(form, profile); if (!Object.keys(payload).length) return;
    setSaving(true); setError(''); setNotice('');
    pending.current = setTimeout(() => {
      pending.current = null; setSaving(false);
      if (failSave.current) { failSave.current = false; setError('Sample save failed. Your edits are still here. Please try again.'); return; }
      setProfile(previous => ({ ...previous, ...payload })); setNotice('Sample profile updated. No request was sent.');
    }, 650);
  };
  const logout = () => {
    if (pending.current) return;
    setLoggingOut(true); setError(''); setNotice('');
    pending.current = setTimeout(() => {
      pending.current = null; setLoggingOut(false);
      if (failLogout.current) { failLogout.current = false; setError('Sample sign-out failed. Please try again.'); return; }
      navigate('/login');
    }, 500);
  };
  const navigatePreview = path => {
    if (pending.current) return;
    if (['/client-dashboard', '/traveler-dashboard', '/cart', '/new-order'].includes(path)) navigate(`/preview${path}`, { state: { ...location.state, previewUser: profile } });
    else if (path.includes('#')) window.location.assign(path);
    else navigate(path);
    window.scrollTo({ top: 0 });
  };
  return <SettingsView key={revision} role={role} profile={profile} phase={['loading', 'error'].includes(scenario) ? scenario : 'ready'} saving={saving} loggingOut={loggingOut} error={error} notice={notice} onSave={save} onEdit={() => { setError(''); setNotice(''); }} onRetry={() => reset()} onLogout={logout} onNavigate={navigatePreview} previewControls={
    <div className="cd-preview-bar"><div><strong>Local preview · Sample account</strong><small>Try profile changes without saving to a real account.</small></div><div className="cd-preview-controls"><label htmlFor="settings-preview-state">Preview state</label><select id="settings-preview-state" value={scenario} onChange={event => reset(event.target.value)}><option value="sample">Account details</option><option value="save-error">Save error</option><option value="signout-error">Sign-out error</option><option value="unverified">Email not verified</option><option value="missing">Missing profile details</option><option value="avatar-error">Unavailable photo</option><option value="loading">Loading</option><option value="error">Loading error</option></select><button onClick={() => reset()}>Reset preview</button><Link to={`/preview/settings?as=${role === 'client' ? 'traveler' : 'client'}`}>{role === 'client' ? 'Traveler settings' : 'Client settings'}</Link><Link to="/login">Back to login</Link></div></div>
  } />;
};
SettingsPreviewScreen.propTypes = { location: PropTypes.object.isRequired };
const SettingsPreview = () => { const location = useLocation(); return <SettingsPreviewScreen key={location.key} location={location} />; };
export default SettingsPreview;
