import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiSend } from 'react-icons/fi';
import PropTypes from 'prop-types';
import { useAuth } from '../Context/AuthContext';
import InputField from './InputField';
import AuthSubmit from './AuthSubmit';
import AuthVerification from './AuthVerification';

const LoginForm = ({ navigate, destination, setStep, step, loginRole, setLoginRole, loading, setLoading, socialBusy }) => {
  const { login, clearError } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '', token: '' });
  const [localError, setLocalError] = useState('');
  const [roleError, setRoleError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const busy = loading || socialBusy;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(previous => ({ ...previous, [name]: value }));
    setLocalError('');
    setRoleError(false);
  };

  const handleCredentialSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setLocalError('');
    clearError();
    if (!['client', 'traveler'].includes(loginRole)) {
      setRoleError(true);
      setLocalError('Choose Client or Traveler to continue.');
      event.currentTarget.querySelector('input[name="role"]')?.focus();
      return;
    }
    setLoading(true);
    try {
      const response = await login(formData.email.trim(), formData.password);
      if (response.success && response.step === 'otp') setStep('otp');
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.data;
      setLocalError(typeof message === 'string' ? message : 'We couldn’t log you in. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (event) => {
    event.preventDefault();
    if (busy) return;
    if (!/^\d{6}$/.test(formData.token)) {
      setLocalError('Enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    setLocalError('');
    clearError();
    try {
      const response = await login(formData.email.trim(), formData.password, formData.token);
      if (response.success && response.step === 'complete') navigate(destination || (loginRole === 'client' ? '/client-dashboard' : '/traveler-dashboard'), { replace: true });
    } catch (error) {
      setLocalError(error.sessionConfirmationPending
        ? 'Your code was accepted, but we couldn’t load your account. Please try again.'
        : 'We couldn’t verify that code. Check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return <AuthVerification email={formData.email.trim()} code={formData.token} onChange={token => { setFormData(previous => ({ ...previous, token })); setLocalError(''); }} onSubmit={handleVerification} loading={loading} error={localError} onBack={() => { setStep('credentials'); setLocalError(''); clearError(); setFormData(previous => ({ ...previous, token: '' })); }} backLabel="Back to login" />;
  }

  return (
    <form onSubmit={handleCredentialSubmit} className="auth-form" aria-busy={loading}>
      <InputField label="Email address" type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} autoComplete="username" required disabled={busy} />
      <InputField label="Password" type="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} autoComplete="current-password" required disabled={busy} showToggle showPassword={showPassword} toggleVisibility={() => setShowPassword(previous => !previous)} />
      <Link to="/forgot-password" className="auth-forgot">Forgot password?</Link>
      <fieldset className="auth-roles" disabled={busy} aria-invalid={roleError} aria-describedby={roleError ? 'login-form-error' : undefined}>
        <legend>How are you using Nexus?</legend>
        <div className="auth-role-options">
          {['client', 'traveler'].map(role => (
            <label key={role} className={`auth-role ${loginRole === role ? 'is-selected' : ''}`}>
              {role === 'client' ? <FiPackage aria-hidden="true" /> : <FiSend aria-hidden="true" />}
              <span><strong>{role === 'client' ? 'Client' : 'Traveler'}</strong><small>{role === 'client' ? 'Find & receive' : 'Carry & deliver'}</small></span>
              <input type="radio" name="role" value={role} checked={loginRole === role} onChange={() => { setLoginRole(role); setRoleError(false); setLocalError(''); }} />
            </label>
          ))}
        </div>
      </fieldset>
      {localError && <p className="auth-error" id="login-form-error" role="alert">{localError}</p>}
      <AuthSubmit loading={loading} disabled={socialBusy} loadingLabel="Logging in…">Log in</AuthSubmit>
    </form>
  );
};
LoginForm.propTypes = {
  navigate: PropTypes.func.isRequired, setStep: PropTypes.func.isRequired, step: PropTypes.string.isRequired,
  destination: PropTypes.string,
  loginRole: PropTypes.string.isRequired, setLoginRole: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired, setLoading: PropTypes.func.isRequired, socialBusy: PropTypes.bool.isRequired,
};
export default LoginForm;
