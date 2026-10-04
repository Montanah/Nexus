import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiCheck, FiClock, FiKey, FiLock, FiMail } from 'react-icons/fi';
import AuthLayout from './AuthLayout';
import AuthSubmit from './AuthSubmit';
import InputField from './InputField';
import { validateRecoveryEmail, validateRecoveryPassword } from './recoveryModel';
import './passwordRecovery.css';

const screens = {
  unavailable: { title: 'Forgot your password?', description: 'Find your way back to your Nexus account.', icon: FiKey },
  request: { title: 'Forgot your password?', description: 'It happens. Start with the email you use for Nexus.', icon: FiKey },
  sent: { title: 'Check your inbox.', description: 'If an account uses that email, a six-digit reset code is the next step.', icon: FiMail },
  reset: { title: 'A fresh start.', description: 'Enter your code and choose a new password for your account.', icon: FiLock },
  complete: { title: 'You’re all set.', description: 'You’ve reached the end of the recovery preview.', icon: FiCheck },
};

const EmailForm = ({ email, busy, onRequest }) => {
  const [value, setValue] = useState(email);
  const [error, setError] = useState('');
  const form = useRef(null);
  const submit = event => {
    event.preventDefault();
    if (busy) return;
    const nextError = validateRecoveryEmail(value); setError(nextError);
    if (nextError) { form.current?.elements.email.focus(); return; }
    onRequest(value.trim());
  };
  return <form ref={form} className="auth-form" onSubmit={submit} noValidate aria-busy={busy}>
    <InputField label="Email address" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required value={value} onChange={event => { setValue(event.target.value); setError(''); }} placeholder="you@example.com" error={error} disabled={busy} />
    <AuthSubmit loading={busy} loadingLabel="Sending code…">Send reset code</AuthSubmit>
    <p className="recovery-footnote"><FiMail aria-hidden="true" />Use an email address you can access.</p>
  </form>;
};
EmailForm.propTypes = { email: PropTypes.string.isRequired, busy: PropTypes.bool.isRequired, onRequest: PropTypes.func.isRequired };

const PasswordForm = ({ busy, onReset }) => {
  const [values, setValues] = useState({ code: '', password: '', confirmation: '' });
  const [errors, setErrors] = useState({});
  const [visible, setVisible] = useState({ password: false, confirmation: false });
  const form = useRef(null);
  const change = event => {
    const { name, value } = event.target;
    setValues(previous => ({ ...previous, [name]: value }));
    setErrors(previous => ({ ...previous, [name]: '' }));
  };
  const submit = event => {
    event.preventDefault();
    if (busy) return;
    const nextErrors = validateRecoveryPassword(values); setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { form.current?.elements[Object.keys(nextErrors)[0]].focus(); return; }
    onReset({ ...values, code: values.code.trim() });
  };
  return <form ref={form} className="auth-form recovery-password-form" noValidate onSubmit={submit} aria-busy={busy}>
    <InputField label="Reset code" name="code" autoComplete="one-time-code" inputMode="numeric" required value={values.code} onChange={change} error={errors.code} disabled={busy} placeholder="6-digit code" />
    <InputField label="New password" name="password" autoComplete="new-password" required value={values.password} onChange={change} error={errors.password} hint="Use at least 8 characters. A longer, unique password is better." disabled={busy} showToggle showPassword={visible.password} toggleVisibility={() => setVisible(previous => ({ ...previous, password: !previous.password }))} />
    <InputField label="Confirm new password" name="confirmation" autoComplete="new-password" required value={values.confirmation} onChange={change} error={errors.confirmation} disabled={busy} showToggle showPassword={visible.confirmation} toggleVisibility={() => setVisible(previous => ({ ...previous, confirmation: !previous.confirmation }))} />
    <AuthSubmit loading={busy} loadingLabel="Resetting password…">Reset password</AuthSubmit>
  </form>;
};
PasswordForm.propTypes = { busy: PropTypes.bool.isRequired, onReset: PropTypes.func.isRequired };

const PasswordRecoveryView = ({ step = 'unavailable', email = '', busy = false, cooldown = 0, error = '', notice = '', previewControls, onRequest, onReset, onContinue, onResend, onChangeEmail }) => {
  const screen = screens[step];
  const Icon = screen.icon;
  const currentStep = step === 'request' ? 0 : step === 'complete' ? 2 : 1;
  return <AuthLayout mode="recovery" title={screen.title} description={screen.description} notice={previewControls} formHeader={<>
    {step !== 'unavailable' && <ol className="recovery-progress" aria-label="Password recovery progress">{['Your email', 'Reset password', 'All set'].map((label, index) => <li key={label} className={index <= currentStep ? 'is-current' : ''} aria-current={index === currentStep ? 'step' : undefined}><span>{index < currentStep ? <FiCheck aria-hidden="true" /> : index + 1}</span><small>{label}</small></li>)}</ol>}
    <span className={`recovery-step-icon ${step === 'complete' ? 'is-complete' : ''}`}><Icon aria-hidden="true" /></span>
  </>}>
    <div className="recovery-content">
      {step === 'unavailable' && <>
        <div className="recovery-unavailable"><span><FiClock aria-hidden="true" /> CURRENTLY UNAVAILABLE</span><h2>Password recovery is taking a pause.</h2><p>You can’t reset your password right now. Please try again later, or log in if you remember it.</p></div>
        <Link to="/login" className="auth-submit">Back to login <FiArrowRight aria-hidden="true" /></Link>
        <p className="recovery-footnote">Your password hasn’t been changed.</p>
      </>}
      {(step === 'sent' || step === 'reset') && <div className="recovery-recipient"><span><FiMail aria-hidden="true" /></span><div><small>RECOVERY EMAIL</small><strong>{email}</strong></div><button type="button" disabled={busy} onClick={onChangeEmail}>Change<span className="recovery-sr-only"> email</span></button></div>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {notice && <p className="recovery-notice" role="status">{notice}</p>}
      {step === 'request' && <EmailForm email={email} busy={busy} onRequest={onRequest} />}
      {step === 'sent' && <>
        <div className="recovery-instructions"><h2>A small code. A fresh start.</h2><p>Copy the code from your reset email, then use it to choose your new password.</p><span><FiClock aria-hidden="true" /> Codes expire after 10 minutes.</span></div>
        <button type="button" className="auth-submit" disabled={busy} onClick={onContinue}>I have my code <FiArrowRight aria-hidden="true" /></button>
      </>}
      {step === 'reset' && <PasswordForm busy={busy} onReset={onReset} />}
      {(step === 'sent' || step === 'reset') && <div className="recovery-resend"><p>Can’t find the email? Check your spam folder.</p><button type="button" onClick={onResend} disabled={busy || cooldown > 0}>{busy ? 'Please wait…' : cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}</button></div>}
      {step === 'complete' && <>
        <div className="recovery-complete"><FiCheck aria-hidden="true" /><div><h2>Preview complete</h2><p>No email was sent and no account password was changed.</p></div></div>
        <Link to="/login" className="auth-submit">Back to login <FiArrowRight aria-hidden="true" /></Link>
      </>}
      {['request', 'sent', 'reset'].includes(step) && <Link to="/login" className="auth-back-link recovery-back"><FiArrowLeft aria-hidden="true" /> Back to login</Link>}
    </div>
  </AuthLayout>;
};

PasswordRecoveryView.propTypes = {
  step: PropTypes.oneOf(Object.keys(screens)), email: PropTypes.string, busy: PropTypes.bool, cooldown: PropTypes.number,
  error: PropTypes.string, notice: PropTypes.string, previewControls: PropTypes.node,
  onRequest: PropTypes.func, onReset: PropTypes.func, onContinue: PropTypes.func, onResend: PropTypes.func, onChangeEmail: PropTypes.func,
};
export default PasswordRecoveryView;
