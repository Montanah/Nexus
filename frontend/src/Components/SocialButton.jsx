import PropTypes from 'prop-types';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';

const SocialButton = ({ platform, onClick, loading = false, disabled = false, label }) => (
  <button type="button" className="auth-social-button" onClick={() => onClick(platform)} disabled={disabled || loading} aria-busy={loading}>
    {loading ? <span className="auth-spinner" aria-hidden="true" /> : platform === 'google' ? <FcGoogle aria-hidden="true" /> : <FaApple aria-hidden="true" />}
    <span>{loading ? 'Connecting…' : label}</span>
  </button>
);
SocialButton.propTypes = {
  platform: PropTypes.oneOf(['google', 'apple']).isRequired, onClick: PropTypes.func.isRequired,
  loading: PropTypes.bool, disabled: PropTypes.bool, label: PropTypes.string.isRequired,
};
export default SocialButton;
