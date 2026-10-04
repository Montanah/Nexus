import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { fetchUserData, updateUserProfile } from '../Services/api';
import SettingsView from '../Components/SettingsView';
import { profileError, profileFromResponse, profilePayload, settingsRole } from '../Components/settingsModel';

const SettingsSession = ({ userId, role }) => {
  const { updateProfile, logout } = useAuth(), navigate = useNavigate();
  const [profile, setProfile] = useState(null), [phase, setPhase] = useState('loading');
  const [reload, setReload] = useState(0), [saving, setSaving] = useState(false), [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const lock = useRef(false), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let cancelled = false; setPhase('loading'); setError(''); setNotice('');
    fetchUserData(userId).then(response => {
      const loaded = profileFromResponse(response, userId);
      if (!cancelled) { setProfile(loaded); setPhase('ready'); }
    }).catch(() => { if (!cancelled) setPhase('error'); });
    return () => { cancelled = true; };
  }, [userId, reload]);
  const save = async form => {
    if (lock.current || phase !== 'ready') return;
    const payload = profilePayload(form, profile);
    if (!Object.keys(payload).length) return;
    lock.current = true; setSaving(true); setError(''); setNotice('');
    try {
      const updated = profileFromResponse(await updateUserProfile(userId, payload), userId, payload);
      if (mounted.current) { setProfile(updated); updateProfile(updated); setNotice('Your profile changes have been saved.'); }
    } catch (error) { if (mounted.current) setError(profileError(error)); }
    finally { lock.current = false; if (mounted.current) setSaving(false); }
  };
  const signOut = async () => {
    if (lock.current) return;
    lock.current = true; setLoggingOut(true); setError(''); setNotice('');
    try { await logout(); } catch { if (mounted.current) setError('We couldn’t sign you out. Please try again.'); }
    finally { lock.current = false; if (mounted.current) setLoggingOut(false); }
  };
  const navigateTo = path => { if (lock.current) return; if (path.includes('#')) window.location.assign(path); else { navigate(path); window.scrollTo({ top: 0 }); } };
  return <SettingsView role={role} profile={profile} phase={phase} saving={saving} loggingOut={loggingOut} error={error} notice={notice} onSave={save} onRetry={() => { if (!lock.current) setReload(value => value + 1); }} onLogout={signOut} onNavigate={navigateTo} onEdit={() => { setError(''); setNotice(''); }} />;
};
SettingsSession.propTypes = { userId: PropTypes.string.isRequired, role: PropTypes.string.isRequired };
const Settings = () => {
  const { user, userId, loading } = useAuth(), location = useLocation(), navigate = useNavigate();
  const role = settingsRole(location.search, location.state, user?.data?.user || user);
  useEffect(() => { if (!loading && !userId) navigate('/login', { replace: true }); }, [loading, userId, navigate]);
  if (loading && (!userId || !user)) return <div className="cd-auth-loading" role="status">Loading your account…</div>;
  if (!userId) return null;
  return <SettingsSession key={userId} userId={userId} role={role} />;
};
export default Settings;
