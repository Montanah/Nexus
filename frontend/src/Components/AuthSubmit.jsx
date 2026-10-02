import PropTypes from 'prop-types';
import { FiArrowUpRight } from 'react-icons/fi';

const AuthSubmit = ({ children, loading = false, disabled = false, loadingLabel = 'Please wait…' }) => (
  <button type="submit" className="auth-submit" disabled={disabled || loading} aria-busy={loading}>
    <span>{loading ? loadingLabel : children}</span>
    {loading ? <span className="auth-spinner" aria-hidden="true" /> : <FiArrowUpRight aria-hidden="true" />}
  </button>
);
AuthSubmit.propTypes = { children: PropTypes.node.isRequired, loading: PropTypes.bool, disabled: PropTypes.bool, loadingLabel: PropTypes.string };
export default AuthSubmit;
