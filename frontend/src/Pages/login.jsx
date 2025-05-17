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

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const query = new URLSearchParams(location.search);
      const code = query.get('code');
      const provider = query.get('state')?.includes('google') ? 'google' : 'apple';

      if (code && provider) {
        setSocialLoading({ google: false, apple: false });
        try {
          const response = await handleSocialCallback(provider, code);
          if (response.success) {
            if (response.data.requiresVerification) {
              setSocialEmail(response.data.email);
              setSocialProvider(provider);
              setStep('social-verify');
            } else {
              await socialLogin(response.data);
              navigate(loginRole === 'client' ? '/client-dashboard' : '/traveler-dashboard');
            }
          } else {
            throw new Error(response.message || 'Social login failed');
          }
        } catch (error) {
          console.error('Social callback error:', error);
          setSocialError(error.message || 'Failed to process social login');
        } finally {
          setSocialLoading({ google: false, apple: false });
        }
      }
    };

    if (location.search.includes('code')) {
      handleCallback();
    }
  }, [location, navigate, socialLogin, loginRole]);

  // Social login handler
  const handleSocialLogin = async (platform) => {
    if (!email.trim() || !loginRole) {
      setSocialError('Please provide an email and select a role.');
      return;
    }

    setSocialLoading((prev) => ({ ...prev, [platform]: true }));
    setSocialError('');

    try {
      await initiateSocialLogin(platform, loginRole);
      // Redirect is handled by initiateSocialLogin via window.location.href
    } catch (error) {
      console.error(`Error initiating ${platform} login:`, error);
      setSocialError(`Failed to initiate ${platform} login`);
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
          {step === 'social-verify' ? (
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