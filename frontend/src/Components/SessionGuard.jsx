import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import AuthLayout from './AuthLayout';
import AuthSubmit from './AuthSubmit';

const SessionGuard = () => {
  const { userId, loading, sessionError, sessionExpired, checkAuth } = useAuth();
  const location = useLocation();
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    let cancelled = false;
    checkAuth().finally(() => { if (!cancelled) setChecked(true); });
    return () => { cancelled = true; };
  }, [checkAuth]);
  if (!checked || loading) return <div className="cd-auth-loading" role="status">Loading your account…</div>;
  if (!userId && sessionError) return (
    <AuthLayout mode="login" title="Let’s reconnect." description="We couldn’t reach your account. Try again when your connection is ready.">
      <form className="auth-form" onSubmit={event => { event.preventDefault(); checkAuth(); }}>
        <p className="auth-error" role="alert">{sessionError}</p>
        <AuthSubmit>Try again</AuthSubmit>
      </form>
    </AuthLayout>
  );
  if (!userId) return <Navigate to="/login" replace state={{ sessionExpired, from: `${location.pathname}${location.search}${location.hash}` }} />;
  return <Outlet />;
};

export default SessionGuard;
