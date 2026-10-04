import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import AuthLayout from '../Components/AuthLayout';
import AuthVerification from '../Components/AuthVerification';
import LoginForm from '../Components/LoginForm';
import SocialLogin from '../Components/SocialLogin';
import { initiateSocialLogin, verifySocialUser } from '../Services/api';
import { sessionDestination } from '../Services/sessionNavigation';

const Login = () => {
  const [step, setStep] = useState('credentials');
  const { socialLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = sessionDestination(location.state?.from);
  const processedCallback = useRef('');
  const [loginRole, setLoginRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState({ google: false, apple: false });
  const [socialError, setSocialError] = useState('');
  const [socialProvider, setSocialProvider] = useState('');
  const [socialEmail, setSocialEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (!query.has('provider') && !query.has('error')) {
      processedCallback.current = '';
      return;
    }
    if (processedCallback.current === location.search) return;
    processedCallback.current = location.search;
    const handleCallback = async () => {
      setIsProcessingCallback(true);
      setSocialError('');
      try {
        if (query.has('error')) throw new Error(query.get('message') || 'Social login could not be completed. Please try again.');
        const provider = query.get('provider');
        const email = query.get('email');
        const role = decodeURIComponent(query.get('state') || '').split('_').at(-1);
        if (!['google', 'apple'].includes(provider) || !email || !['client', 'traveler'].includes(role)) throw new Error('This sign-in link is incomplete. Please start again.');
        setLoginRole(role);
        if (query.get('requiresVerification') === 'true') {
          setSocialEmail(email);
          setSocialProvider(provider);
          setStep('social-verify');
        } else if (query.get('token')) {
          await socialLogin({ token: query.get('token'), user: { email, isVerified: true } });
          navigate(destination || (role === 'client' ? '/client-dashboard' : '/traveler-dashboard'), { replace: true });
        } else {
          throw new Error('This sign-in link is incomplete. Please start again.');
        }
      } catch (error) {
        setSocialError(error.message || 'Social login could not be completed. Please try again.');
        setStep('credentials');
      } finally {
        setIsProcessingCallback(false);
      }
    };
    handleCallback();
  }, [location.search, navigate, socialLogin, destination]);

  const handleSocialLogin = async (platform) => {
    if (loading || socialLoading.google || socialLoading.apple) return;
    if (!['client', 'traveler'].includes(loginRole)) {
      setSocialError('Choose Client or Traveler above before continuing.');
      document.querySelector('input[name="role"]')?.focus();
      return;
    }
    setSocialLoading(previous => ({ ...previous, [platform]: true }));
    setSocialError('');
    try {
      const response = await initiateSocialLogin(platform, loginRole);
      if (!response.url) throw new Error('No redirect URL received');
      window.location.assign(response.url);
    } catch {
      setSocialError(`We couldn’t connect to ${platform === 'google' ? 'Google' : 'Apple'}. Please try again.`);
      setSocialLoading({ google: false, apple: false });
    }
  };

  const handleSocialVerifySubmit = async (event) => {
    event.preventDefault();
    if (verifying) return;
    if (!/^\d{6}$/.test(verificationCode)) {
      setSocialError('Enter the 6-digit code from your email.');
      return;
    }
    setVerifying(true);
    setSocialError('');
    try {
      const response = await verifySocialUser({ email: socialEmail, code: verificationCode, provider: socialProvider });
      if (!response.success && response.status !== 200) throw new Error('Verification failed');
      await socialLogin(response.data);
      navigate(destination || (loginRole === 'client' ? '/client-dashboard' : '/traveler-dashboard'), { replace: true });
    } catch {
      setSocialError('We couldn’t verify that code. Check the code and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const verification = step !== 'credentials';
  return (
    <AuthLayout mode="login" title={verification ? 'Check your inbox.' : 'Welcome back.'} description={verification ? 'A quick verification, and you’re on your way.' : 'Your next delivery or journey starts here.'} verification={verification}>
      {isProcessingCallback ? <div className="auth-processing" role="status"><span className="auth-spinner" aria-hidden="true" />Completing your sign-in…</div> : step === 'social-verify' ? (
        <AuthVerification email={socialEmail} code={verificationCode} onChange={value => { setVerificationCode(value); setSocialError(''); }} onSubmit={handleSocialVerifySubmit} loading={verifying} error={socialError} onBack={() => { setStep('credentials'); setSocialError(''); setVerificationCode(''); navigate('/login', { replace: true }); }} backLabel="Back to login" />
      ) : (
        <>
          {location.state?.sessionExpired && step === 'credentials' && <p className="auth-error" role="status">Your session has ended. Log in again to continue.</p>}
          {location.state?.verified && step === 'credentials' && <p className="auth-success" role="status">Your email is verified. Log in to get started.</p>}
          <LoginForm navigate={navigate} destination={destination} setStep={setStep} step={step} loginRole={loginRole} setLoginRole={role => { setLoginRole(role); setSocialError(''); }} loading={loading} setLoading={setLoading} socialBusy={socialLoading.google || socialLoading.apple} />
          {step === 'credentials' && <SocialLogin onSocialSignup={handleSocialLogin} loading={socialLoading} error={socialError} disabled={loading} />}
        </>
      )}
    </AuthLayout>
  );
};
export default Login;
