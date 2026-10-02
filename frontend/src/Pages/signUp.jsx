import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import AuthLayout from '../Components/AuthLayout';
import AuthSubmit from '../Components/AuthSubmit';
import AuthVerification from '../Components/AuthVerification';
import SocialLogin from '../Components/SocialLogin';
import InputField from '../Components/InputField';
import { signup, verifyUser, verifySocialUser, initiateSocialSignup } from '../Services/api';

const SignUp = () => {
  const { socialLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const processedCallback = useRef('');
  const [step, setStep] = useState('register');
  const [formData, setFormData] = useState({ name: '', email: '', phone_number: '', password: '', verifyPassword: '' });
  const [formErrors, setFormErrors] = useState({});
  const [verificationCode, setVerificationCode] = useState('');
  const [socialProvider, setSocialProvider] = useState('');
  const [socialEmail, setSocialEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [socialLoading, setSocialLoading] = useState({ google: false, apple: false });
  const [socialError, setSocialError] = useState('');
  const busy = loading || socialLoading.google || socialLoading.apple;

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (!query.has('provider') && !query.has('error')) {
      processedCallback.current = '';
      return;
    }
    if (processedCallback.current === location.search) return;
    processedCallback.current = location.search;
    if (query.has('error')) {
      setSocialError(query.get('message') || 'Social signup could not be completed. Please try again.');
      setStep('register');
      return;
    }
    const provider = query.get('provider');
    const email = query.get('email');
    if (!['google', 'apple'].includes(provider) || !email) {
      setSocialError('This signup link is incomplete. Please start again.');
      return;
    }
    if (query.get('requiresVerification') === 'true') {
      setSocialEmail(email);
      setSocialProvider(provider);
      setStep('social-verify');
    } else {
      navigate('/login', { replace: true });
    }
  }, [location.search, navigate]);

  const getErrorMessage = (failure, fallback) => {
    const data = failure.response?.data;
    const message = data?.message || data?.data?.message || data?.data || data?.error;
    return typeof message === 'string' ? message : fallback;
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(previous => ({ ...previous, [name]: value }));
    setFormErrors(previous => ({ ...previous, [name]: '' }));
    setError('');
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    if (busy) return;
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) errors.email = 'Enter a valid email address.';
    if (!formData.phone_number.trim()) errors.phone_number = 'Enter your phone number.';
    if (formData.password.length < 8) errors.password = 'Use at least 8 characters.';
    if (!formData.verifyPassword || formData.password !== formData.verifyPassword) errors.verifyPassword = 'Your passwords must match.';
    setFormErrors(errors);
    setError('');
    if (Object.keys(errors).length) {
      const field = event.currentTarget.elements.namedItem(Object.keys(errors)[0]);
      requestAnimationFrame(() => field?.focus());
      return;
    }
    setLoading(true);
    try {
      const response = await signup({ ...formData, name: formData.name.trim(), email: formData.email.trim(), phone_number: formData.phone_number.trim() });
      if (response.status !== 201) throw new Error('Signup failed');
      setVerificationCode('');
      setStep('verify');
    } catch (failure) {
      setError(getErrorMessage(failure, 'We couldn’t create your account. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (event) => {
    event.preventDefault();
    if (busy) return;
    if (!/^\d{6}$/.test(verificationCode)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (step === 'social-verify') {
        const response = await verifySocialUser({ email: socialEmail, code: verificationCode, provider: socialProvider });
        if (!response.success && response.status !== 200) throw new Error('Verification failed');
        await socialLogin(response.data);
      } else {
        const response = await verifyUser({ email: formData.email.trim(), code: verificationCode });
        if (response.status !== 200) throw new Error('Verification failed');
      }
      navigate('/login', { state: { verified: true } });
    } catch (failure) {
      setError(getErrorMessage(failure, 'We couldn’t verify that code. Check the code and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignup = async (platform) => {
    if (busy) return;
    setSocialLoading(previous => ({ ...previous, [platform]: true }));
    setSocialError('');
    try {
      const response = await initiateSocialSignup(platform);
      if (!response.url) throw new Error('No redirect URL received');
      window.location.assign(response.url);
    } catch {
      setSocialError(`We couldn’t connect to ${platform === 'google' ? 'Google' : 'Apple'}. Please try again.`);
      setSocialLoading({ google: false, apple: false });
    }
  };

  const verification = step !== 'register';
  return (
    <AuthLayout mode="signup" title={verification ? 'Check your inbox.' : 'Your journey starts here.'} description={verification ? 'Let’s verify your email and make it official.' : 'Create an account. Make your first connection.'} verification={verification}>
      {verification ? (
        <AuthVerification email={step === 'social-verify' ? socialEmail : formData.email.trim()} code={verificationCode} onChange={value => { setVerificationCode(value); setError(''); }} onSubmit={handleVerifySubmit} loading={loading} error={error} onBack={() => { setStep('register'); setVerificationCode(''); setError(''); setSocialError(''); navigate('/signup', { replace: true }); }} backLabel={step === 'social-verify' ? 'Back to signup' : 'Use a different email'} />
      ) : (
        <>
          <form onSubmit={handleSignup} className="auth-form" noValidate aria-busy={loading}>
            <InputField label="Full name" name="name" placeholder="Your full name" value={formData.name} onChange={handleInputChange} error={formErrors.name} autoComplete="name" required disabled={busy} />
            <InputField label="Email address" type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} error={formErrors.email} autoComplete="email" required disabled={busy} />
            <InputField label="Phone number" type="tel" name="phone_number" placeholder="e.g. +254 712 345 678" value={formData.phone_number} onChange={handleInputChange} error={formErrors.phone_number} autoComplete="tel" required disabled={busy} />
            <div className="auth-password-row">
              <InputField label="Password" type="password" name="password" placeholder="Create a password" value={formData.password} onChange={handleInputChange} error={formErrors.password} autoComplete="new-password" minLength={8} required disabled={busy} showToggle toggleVisibility={() => setShowPassword(previous => !previous)} showPassword={showPassword} />
              <InputField label="Confirm password" type="password" name="verifyPassword" placeholder="Repeat password" value={formData.verifyPassword} onChange={handleInputChange} error={formErrors.verifyPassword} autoComplete="new-password" minLength={8} required disabled={busy} showToggle toggleVisibility={() => setShowVerifyPassword(previous => !previous)} showPassword={showVerifyPassword} />
            </div>
            <p className="auth-password-hint">Use at least 8 characters for your password.</p>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <AuthSubmit loading={loading} disabled={socialLoading.google || socialLoading.apple} loadingLabel="Creating your account…">Create account</AuthSubmit>
          </form>
          <SocialLogin onSocialSignup={handleSocialSignup} loading={socialLoading} error={socialError} disabled={loading} />
        </>
      )}
    </AuthLayout>
  );
};
export default SignUp;
