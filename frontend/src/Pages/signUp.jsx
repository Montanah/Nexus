import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import axios from 'axios';
import Header from '../Components/Header';
import SignupForm from '../Components/SignUpForm';
import SocialLogin from '../Components/SocialLogin';
import Footer from '../Components/Footer';

const SignUp = () => {
  const { socialLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
  });

  const [socialLoading, setSocialLoading] = useState(false);
  const [socialError, setSocialError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSocialSignup = (platform) => {
    setSocialLoading(true);
    setSocialError('');

    const redirectUri = `${window.location.origin}/signup`;

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
      const response = await axios.post(endpoint, {
        code,
        name: formData.name || 'Unknown',
        email: formData.email || '',
        phone_number: formData.phone_number || '',
      });

      if (response.status === 200 || response.status === 201) {
        const { userId, userData } = response.data;
        await socialLogin(userId, userData);
        console.log(`${platform.charAt(0).toUpperCase() + platform.slice(1)} Signup successful`);
        navigate('/login');
      }
    } catch (err) {
      console.error(`${platform.charAt(0).toUpperCase() + platform.slice(1)} Callback Error:`, err);
      setSocialError('Something went wrong during social signup. Please try again.');
      alert(
        err.response?.data?.message ||
        (err.request ? 'Network error. Please check your connection.' : 'An unexpected error occurred.')
      );
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <Header />

      {/* Main Signup Form */}
      <div className="flex-grow flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 mt-10">
          <div className="text-right mb-4">
            <button
              onClick={() => navigate('/login')}
              className="text-indigo-600 hover:underline text-sm"
            >
              Already have an account? Sign In
            </button>
          </div>
          <h2 className="text-3xl font-bold text-center mb-6 text-indigo-900">
            Create an Account
          </h2>
          <SignupForm navigate={navigate} />
          <SocialLogin
            onSocialSignup={handleSocialSignup}
            loading={socialLoading}
            error={socialError}
          />
          <div className="text-center text-sm text-gray-500 mt-6">
            By signing up, you agree to our{' '}
            <a href="#" className="text-indigo-600 hover:underline">
              Terms of Use
            </a>{' '}
            &{' '}
            <a href="#" className="text-indigo-600 hover:underline">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>

      {/* Footer - Centered at Bottom */}
      <div className="mt-auto w-full flex justify-center items-center text-gray-500 text-sm">
        <Footer />
      </div>
    </div>
  );
};

export default SignUp;
