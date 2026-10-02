import PropTypes from 'prop-types';
import SocialButton from './SocialButton';

const SocialLogin = ({ onSocialSignup, loading, error, disabled = false }) => (
  <div className="auth-social">
    <div className="auth-divider"><span>or continue with</span></div>
    <div className="auth-social-buttons">
      <SocialButton platform="google" label="Google" onClick={onSocialSignup} loading={loading.google} disabled={disabled || loading.google || loading.apple} />
      <SocialButton platform="apple" label="Apple" onClick={onSocialSignup} loading={loading.apple} disabled={disabled || loading.google || loading.apple} />
    </div>
    {error && <p className="auth-error" role="alert">{error}</p>}
  </div>
);
SocialLogin.propTypes = {
  onSocialSignup: PropTypes.func.isRequired,
  loading: PropTypes.shape({ google: PropTypes.bool, apple: PropTypes.bool }).isRequired,
  error: PropTypes.string, disabled: PropTypes.bool,
};
export default SocialLogin;
