import PropTypes from 'prop-types';
import { FiArrowLeft, FiMail } from 'react-icons/fi';
import InputField from './InputField';
import AuthSubmit from './AuthSubmit';

const AuthVerification = ({ email, code, onChange, onSubmit, loading, error, onBack, backLabel = 'Use a different account' }) => (
  <form onSubmit={onSubmit} className="auth-form" aria-busy={loading}>
    <div className="auth-verification-note"><span><FiMail aria-hidden="true" /></span><p>Enter the code sent to <strong>{email}</strong></p></div>
    <InputField label="Verification code" name="verificationCode" value={code} onChange={event => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required disabled={loading} hint="Enter the 6-digit code from your email." />
    {error && <p className="auth-error" role="alert">{error}</p>}
    <AuthSubmit loading={loading} loadingLabel="Verifying…">Verify and continue</AuthSubmit>
    <p className="auth-verification-help">Can’t find the email? Check your spam or junk folder.</p>
    <button type="button" className="auth-back-link" onClick={onBack} disabled={loading}><FiArrowLeft aria-hidden="true" />{backLabel}</button>
  </form>
);
AuthVerification.propTypes = {
  email: PropTypes.string.isRequired, code: PropTypes.string.isRequired, onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired, loading: PropTypes.bool.isRequired, error: PropTypes.string,
  onBack: PropTypes.func.isRequired, backLabel: PropTypes.string,
};
export default AuthVerification;
