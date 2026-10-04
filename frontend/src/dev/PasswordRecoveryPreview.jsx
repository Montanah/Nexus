import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PasswordRecoveryView from '../Components/PasswordRecoveryView';
import { validateRecoveryEmail, validateRecoveryPassword } from '../Components/recoveryModel';
import './passwordRecoveryPreview.css';

const sampleEmail = 'alex@example.test';
const sampleCode = '654321';
const choices = [
  ['request', 'Enter email'], ['sent', 'Email sent'], ['reset', 'New password'], ['complete', 'Complete'],
  ['send-error', 'Send error'], ['resend-error', 'Resend error'], ['reset-error', 'Reset error'],
  ['expired', 'Expired code'], ['unavailable', 'Live unavailable state'],
];

const PasswordRecoveryPreview = () => {
  const [scenario, setScenario] = useState('request');
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const pending = useRef(null);
  const failure = useRef('');
  const expiresAt = useRef(0);
  useEffect(() => () => clearTimeout(pending.current), []);
  useEffect(() => {
    if (!cooldownUntil) return;
    const update = () => setCooldown(Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)));
    update(); const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [cooldownUntil]);

  const selectScenario = next => {
    clearTimeout(pending.current); pending.current = null;
    setScenario(next); setRevision(value => value + 1); setBusy(false); setError(''); setNotice('');
    setCooldownUntil(0); setCooldown(0);
    setEmail(next === 'request' || next === 'send-error' ? '' : sampleEmail);
    setStep(next === 'send-error' ? 'request' : next === 'resend-error' ? 'sent' : ['reset-error', 'expired'].includes(next) ? 'reset' : next);
    failure.current = next;
    expiresAt.current = next === 'expired' ? 0 : Date.now() + 600000;
    if (next === 'expired') setError('This sample code has expired. Resend a code to continue.');
  };
  const simulate = work => {
    if (pending.current) return;
    setBusy(true); setError(''); setNotice('');
    pending.current = setTimeout(() => { pending.current = null; setBusy(false); work(); }, 650);
  };
  const issueCode = () => {
    expiresAt.current = Date.now() + 600000;
    setCooldown(30); setCooldownUntil(Date.now() + 30000);
  };
  const request = value => {
    if (validateRecoveryEmail(value)) return;
    simulate(() => {
      if (failure.current === 'send-error') { failure.current = ''; setError('Sample send failed. Please try again.'); return; }
      setEmail(value); issueCode(); setStep('sent');
      setNotice('Email delivery simulated. Use the preview code above to continue.');
    });
  };
  const resend = () => {
    if (cooldown > 0) return;
    simulate(() => {
      if (failure.current === 'resend-error') { failure.current = ''; setError('Sample resend failed. Please try again.'); return; }
      issueCode(); setNotice('A new code was simulated. Use the preview code above.');
    });
  };
  const reset = values => {
    if (Object.keys(validateRecoveryPassword(values)).length) return;
    // Keep credentials in the form only; the simulator needs just the sample code.
    const code = values.code;
    simulate(() => {
      if (Date.now() >= expiresAt.current) { setError('This sample code has expired. Resend a code to continue.'); return; }
      if (code !== sampleCode) { setError('That sample code doesn’t match. Use the preview code above.'); return; }
      if (failure.current === 'reset-error') { failure.current = ''; setError('Sample reset failed. Your entries are still here. Please try again.'); return; }
      setStep('complete'); setNotice(''); setCooldownUntil(0); setCooldown(0);
    });
  };
  const changeEmail = () => {
    if (pending.current) return;
    setStep('request'); setNotice(''); setError(''); setCooldownUntil(0); setCooldown(0); expiresAt.current = 0;
  };

  return <PasswordRecoveryView key={revision} step={step} email={email} busy={busy} cooldown={cooldown} error={error} notice={notice} onRequest={request} onReset={reset} onResend={resend} onChangeEmail={changeEmail} onContinue={() => { if (!pending.current) { setStep('reset'); setNotice(''); } }} previewControls={
    <aside className="recovery-preview" aria-label="Local recovery preview">
      <div><strong>Local preview · Password recovery</strong><p>No emails are sent or passwords changed. Use sample details.</p><small>Preview code: <b>{sampleCode}</b></small></div>
      <div className="recovery-preview-controls"><label htmlFor="recovery-preview-state">Preview state</label><select id="recovery-preview-state" value={scenario} onChange={event => selectScenario(event.target.value)}>{choices.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" onClick={() => selectScenario('request')}>Restart preview</button><Link to="/forgot-password">View live page</Link></div>
    </aside>
  } />;
};
export default PasswordRecoveryPreview;
