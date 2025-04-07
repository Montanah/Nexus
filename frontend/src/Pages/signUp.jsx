import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import Header from '../Components/Header';
import SocialLogin from '../Components/SocialLogin';
import Footer from '../Components/Footer';
import InputField from '../Components/InputField';
import { signup, verifyUser } from '../Services/api';

const SignUp = () => {
  const { socialLogin } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [step, setStep] = useState('register'); // 'register' or 'verify'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    verifyPassword: '',
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    verifyPassword: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [socialLoading, setSocialLoading] = useState({ // Track loading per platform
    google: false,
    apple: false,
  });
  const [socialError, setSocialError] = useState('');

  // Form validation
  const validateForm = () => {
    const errors = {
      name: '',
      email: '',
      phone_number: '',
      password: '',
      verifyPassword: '',
    };

    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }

    if (!formData.phone_number.trim()) {
      errors.phone_number = 'Phone number is required';
      isValid = false;
    }

    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (formData.password !== formData.verifyPassword) {
      errors.verifyPassword = 'Passwords do not match';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Input handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') setShowPassword(!showPassword);
    else setShowVerifyPassword(!showVerifyPassword);
  };

  // Registration submit
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await signup(formData);
      if (response.status === 201) {
        setStep('verify');
      }
    } catch (error) {
      console.error('Signup error:', error);
      if (error.response) {
        setError(
          error.response?.data?.message ||
          'Something went wrong. Please try again.'
        );
      } else if (error.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Verification submit
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!verificationCode) {
      setError('Please enter your verification code');
      setLoading(false);
      return;
    }

    try {
      const response = await verifyUser({
        email: formData.email,
        code: verificationCode,
      });

      if (response.status === 200) {
        // Reset form and go to login
        setFormData({
          name: '',
          email: '',
          phone_number: '',
          password: '',
          verifyPassword: '',
        });
        setVerificationCode('');
        navigate('/login');
      }
    } catch (error) {
      console.error('Verification error:', error);
      if (error.response) {
        setError(
          error.response?.data?.message ||
          'Verification failed. Please try again.'
        );
      } else if (error.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Social login handlers
  const handleSocialSignup = (platform) => {
    setSocialLoading((prev) => ({ ...prev, [platform]: true })); // Set loading for specific platform
    setSocialError('');

    const redirectUri = 'http://localhost:3001/auth/google/callback';

    if (platform === 'google') {
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        setSocialError('Google Client ID is missing.');
        setSocialLoading((prev) => ({ ...prev, [platform]: false }));
        return;
      }
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile`;
      console.log('Google Auth URL:', googleAuthUrl);
      window.location.href = googleAuthUrl;
    } else if (platform === 'apple') {
      const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID;
      if (!appleClientId) {
        setSocialError('Apple Client ID is missing.');
        setSocialLoading((prev) => ({ ...prev, [platform]: false }));
        return;
      }
      const appleAuthUrl = `https://appleid.apple.com/auth/authorize?client_id=${appleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile`;
      console.log('Apple Auth URL:', appleAuthUrl);
      window.location.href = appleAuthUrl;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <Header />

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
            {step === 'register' ? 'Create an Account' : 'Verify Your Account'}
          </h2>

          {step === 'register' ? (
            <>
              <form onSubmit={handleSignup} className="space-y-4">
                <InputField
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={formErrors.name}
                />
                <InputField
                  type="email"
                  name="email"
                  placeholder="johndoe@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={formErrors.email}
                />
                <InputField
                  type="tel"
                  name="phone_number"
                  placeholder="+254712345678"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  error={formErrors.phone_number}
                />
                <InputField
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  error={formErrors.password}
                  showToggle
                  toggleVisibility={() => togglePasswordVisibility('password')}
                  showPassword={showPassword}
                />
                <InputField
                  type={showVerifyPassword ? 'text' : 'password'}
                  name="verifyPassword"
                  placeholder="Verify Password"
                  value={formData.verifyPassword}
                  onChange={handleInputChange}
                  error={formErrors.verifyPassword}
                  showToggle
                  toggleVisibility={() => togglePasswordVisibility('verifyPassword')}
                  showPassword={showVerifyPassword}
                />

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Sign Up'}
                </button>
              </form>

              <SocialLogin
                onSocialSignup={handleSocialSignup}
                loading={socialLoading} // Pass object instead of boolean
                error={socialError}
              />
            </>
          ) : (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Enter verification code sent to {formData.email}
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

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify Account'}
              </button>
            </form>
          )}

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

      <div className="mt-auto w-full flex justify-center items-center text-gray-500 text-sm">
        <Footer />
      </div>
    </div>
  );
};

export default SignUp;