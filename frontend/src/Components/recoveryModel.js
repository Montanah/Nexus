export const validateRecoveryEmail = email => (
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.trim().length <= 254
    ? '' : 'Enter a valid email address.'
);

// These form rules match the existing six-digit code and signup UI conventions.
// They do not replace server-side verification or enable the deferred reset API.
export const validateRecoveryPassword = ({ code, password, confirmation }) => {
  const errors = {};
  if (!/^\d{6}$/.test(code.trim())) errors.code = 'Enter the six-digit code.';
  if (password.length < 8 || !password.trim()) errors.password = 'Use at least 8 characters.';
  if (!confirmation) errors.confirmation = 'Enter your new password again.';
  else if (confirmation !== password) errors.confirmation = 'Your passwords don’t match.';
  return errors;
};
