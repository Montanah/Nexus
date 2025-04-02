import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import axios from 'axios';
import Header from '../Components/Header';
import LoginForm from '../Components/LoginForm';
import SocialLogin from '../Components/SocialLogin';
import Footer from '../Components/Footer';

const Login = () => {
  const [step, setStep] = useState('credentials'); // 'credentials' or 'otp'
  const { socialLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [loginRole, setLoginRole] = useState('');
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialError, setSocialError] = useState('');

  const handleSocialLogin = (platform) => {
    setSocialLoading(true);
    setSocialError('');

    if (!email.trim() || !loginRole) {
      setSocialError('Please provide an email and select a role.');
      setSocialLoading(false);
      return;
    }

    const redirectUri = `${window.location.origin}/login`;

    if (platform === 'google') {
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=GOOGLE_CLIENT_ID&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile`;
      window.location.href = googleAuthUrl;
    } else if (platform === 'apple') {
      const appleAuthUrl = `https://appleid.apple.com/auth/authorize?client_id=APPLE_CLIENT_ID&redirect_uri=${redirectUri}&response_type=code%20id_token&scope=name%20email&response_mode=form_post`;
      window.location.href = appleAuthUrl;
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');

    if (code) {
      setSocialLoading(true);
      const platform = location.pathname.includes('google') ? 'google' : 'apple';
      handleSocialCallback(platform, code);
    }
  }, [location]);

  const handleSocialCallback = async (platform, code) => {
    try {
      const endpoint = platform === 'google' ? '/auth/google/callback' : '/auth/apple/callback';
      const response = await axios.post(endpoint, { code, email, role: loginRole });

      if (response.status === 200 || response.status === 201) {
        const { userId, userData } = response.data;
        await socialLogin(userId, { ...userData, role: loginRole });
        console.log(`${platform.charAt(0).toUpperCase() + platform.slice(1)} Login successful`);
        navigate(loginRole === 'client' ? '/client-dashboard' : '/traveler-dashboard');
      }
    } catch (err) {
      console.error(`${platform.charAt(0).toUpperCase() + platform.slice(1)} Callback Error:`, err);
      setSocialError('Something went wrong during social login. Please try again.');
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      {/* Navbar */}
      <Header />

      {/* Main Login Container */}
      <div className="flex-grow flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => navigate('/signup')}
              className="text-indigo-600 hover:underline transition-colors text-sm ml-43"
            >
              Don’t have an account? Sign Up
            </button>
          </div>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-indigo-900 mb-2 text-center">Welcome back</h2>
          </div>
          <LoginForm navigate={navigate} setStep={setStep} step={step} />
          {step === 'credentials' && (
            <SocialLogin 
              onSocialSignup={handleSocialLogin} 
              loading={socialLoading} 
              error={socialError}
            />
          )}
        </div>
      </div>

      {/* Footer - Centered at Bottom */}
      <div className="mt-auto w-full flex justify-center items-center text-gray-500 text-sm">
        <Footer />
      </div>
    </div>
  );
};

export default Login;
