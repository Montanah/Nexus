import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import Header from '../Components/Header';
import LoginForm from '../Components/LoginForm';
import SocialLogin from '../Components/SocialLogin';
import Footer from '../Components/Footer';
import { initiateSocialLogin, handleSocialCallback, verifySocialUser } from '../Services/api';

const Login = () => {
  const [step, setStep] = useState('credentials'); // 'credentials', 'otp', 'social-verify'
  const { socialLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [loginRole, setLoginRole] = useState('');
  const [socialLoading, setSocialLoading] = useState({ google: false, apple: false });
  const [socialError, setSocialError] = useState('');
  const [socialProvider, setSocialProvider] = useState('');
  const [socialEmail, setSocialEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

  // Handle OAuth callback
  useEffect(() => {
  const handleCallback = async () => {
    console.log('🔍 handleCallback started');
    console.log('🔍 Current location.search:', location.search);
    const query = new URLSearchParams(location.search);
    const provider = query.get('provider');
    const email = query.get('email');
    const requiresVerification = query.get('requiresVerification') === 'true';
    const token = query.get('token');
    const state = query.get('state');
    const error = query.get('error');
    const message = query.get('message');

    let role = '';
    if (state) {
      const stateParts = decodeURIComponent(state).split('_');
      role = stateParts[3] || ''; // Expects provider_flow_timestamp_role
      console.log('Extracted state:', state, 'role:', role);
    }

    if (error) {
      console.error('OAuth error:', message);
      setSocialError(decodeURIComponent(message) || 'Failed to process social login');
      setStep('credentials');
      setIsProcessingCallback(false);
      return;
    }

    if (!provider || !email || !role || isProcessingCallback) {
      console.log('🚫 Missing provider, email, role, or already processing');
      setSocialError('Invalid callback parameters');
      setStep('credentials');
      setIsProcessingCallback(false);
      return;
    }

    setIsProcessingCallback(true);
    setSocialLoading({ google: false, apple: false });
    setSocialError('');

    try {
      setLoginRole(role);
      if (requiresVerification) {
        console.log('🔄 Transitioning to social-verify step for email:', email);
        setSocialEmail(decodeURIComponent(email));
        setSocialProvider(provider);
        setStep('social-verify');
      } else if (token) {
        console.log('✅ No verification required, logging in with token:', token);
        await socialLogin({ token, user: { email: decodeURIComponent(email), isVerified: true } });
        navigate(role === 'client' ? '/client-dashboard' : '/traveler-dashboard');
      } else {
        throw new Error('Invalid callback parameters');
      }
    } catch (error) {
      console.error('Social callback error:', error);
      setSocialError(error.message || 'Failed to process social login');
      setStep('credentials');
    } finally {
      setIsProcessingCallback(false);
      setSocialLoading({ google: false, apple: false });
    }
  };

  if (location.search.includes('provider') && !isProcessingCallback) {
    handleCallback();
  }
}, [location.search, navigate, socialLogin]);

  // Social login handler
  const handleSocialLogin = async (platform) => {
    if (!loginRole) {
      setSocialError('Please select a role (Client or Traveler).');
      return;
    }

    setSocialLoading((prev) => ({ ...prev, [platform]: true }));
    setSocialError('');

    try {
      const response = await initiateSocialLogin(platform, loginRole);
      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('No redirect URL received');
      }
    } catch (error) {
      console.error(`Error initiating ${platform} login:`, error);
      setSocialError(`Failed to initiate ${platform} login`);
    } finally {
      setSocialLoading((prev) => ({ ...prev, [platform]: false }));
    }
  };

  // Social verification submit
  const handleSocialVerifySubmit = async (e) => {
    e.preventDefault();
    setSocialLoading({ google: false, apple: false });
    setSocialError('');

    if (!verificationCode) {
      setSocialError('Please enter your verification code');
      return;
    }

    try {
      const response = await verifySocialUser({
        email: socialEmail,
        code: verificationCode,
        provider: socialProvider,
      });

      if (response.success) {
        await socialLogin(response.data);
        setVerificationCode('');
        setSocialEmail('');
        setSocialProvider('');
        navigate(loginRole === 'client' ? '/client-dashboard' : '/traveler-dashboard');
      } else {
        throw new Error(response.message || 'Social verification failed');
      }
    } catch (error) {
      console.error('Social verification error:', error);
      setSocialError(error.message || 'Verification failed. Please try again.');
    } finally {
      setSocialLoading({ google: false, apple: false });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <Header />

      <div className="flex-grow flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => navigate('/signup')}
              className="text-indigo-600 hover:underline transition-colors text-sm ml-auto"
            >
              Don’t have an account? Sign Up
            </button>
          </div>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-indigo-900 mb-2 text-center">Welcome back</h2>
          </div>
          {isProcessingCallback ? (
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
              <p className="text-indigo-700 font-medium">Processing social login...</p>
            </div>
          ) : step === 'social-verify' ? (
            <form onSubmit={handleSocialVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Enter verification code sent to {socialEmail}
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  required
                />
              </div>
              {socialError && <p className="text-red-500 text-sm">{socialError}</p>}
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
                disabled={socialLoading.google || socialLoading.apple}
              >
                {socialLoading.google || socialLoading.apple ? 'Verifying...' : 'Verify Social Account'}
              </button>
            </form>
          ) : (
            <>
              <LoginForm
                navigate={navigate}
                setStep={setStep}
                step={step}
                email={email}
                setEmail={setEmail}
                loginRole={loginRole}
                setLoginRole={setLoginRole}
              />
              {step === 'credentials' && (
                <SocialLogin
                  onSocialSignup={handleSocialLogin}
                  loading={socialLoading}
                  error={socialError}
                />
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-auto w-full flex justify-center items-center text-gray-500 text-sm">
        <Footer />
      </div>
    </div>
  );
};

export default Login;