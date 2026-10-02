import { useId } from 'react';
import PropTypes from 'prop-types';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const InputField = ({ label, type = 'text', name, error, hint, showToggle = false, toggleVisibility, showPassword = false, disabled = false, ...inputProps }) => {
  const id = useId();
  const descriptionIds = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className={`auth-input-wrap ${showToggle ? 'auth-input-password' : ''}`}>
        <input {...inputProps} id={id} name={name} disabled={disabled} type={showToggle ? (showPassword ? 'text' : 'password') : type} aria-invalid={Boolean(error)} aria-describedby={descriptionIds} />
        {showToggle && <button type="button" className="auth-password-toggle" onClick={toggleVisibility} aria-label={`${showPassword ? 'Hide' : 'Show'} ${label.toLowerCase()}`} aria-pressed={showPassword} aria-controls={id} disabled={disabled}>{showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}</button>}
      </div>
      {hint && <p id={`${id}-hint`} className="auth-field-hint">{hint}</p>}
      {error && <p id={`${id}-error`} className="auth-field-error">{error}</p>}
    </div>
  );
};
InputField.propTypes = {
  label: PropTypes.string.isRequired, type: PropTypes.string, name: PropTypes.string.isRequired,
  error: PropTypes.string, hint: PropTypes.string, showToggle: PropTypes.bool,
  toggleVisibility: PropTypes.func, showPassword: PropTypes.bool, disabled: PropTypes.bool,
};
export default InputField;
