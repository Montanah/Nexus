import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import Header from '../Components/Header';
import SocialLogin from '../Components/SocialLogin';
import Footer from '../Components/Footer';
import InputField from '../Components/InputField';
import { signup, verifyUser, initiateSocialLogin, handleSocialCallback, verifySocialUser, initiateSocialSignup } from '../Services/api';

const SignUp = () => {
  const { socialLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form state
  const [step, setStep] = useState('register'); // 'register', 'verify', 'social-verify'
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
  const [socialProvider, setSocialProvider] = useState(''); // Track provider for social verification
  const [socialEmail, setSocialEmail] = useState(''); // Email for social verification
  const [showPassword, setShowPassword] = useState(false);
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [socialLoading, setSocialLoading] = useState({ // Track loading per platform
    google: false,
    apple: false,
  });
  const [socialError, setSocialError] = useState('');
  const [isProcessingCallback, setIsProcessingCallback] = useState(false)

  // Handle OAuth callback
 useEffect(() => {
  const handleCallback = async () => {
    console.log('🔍 handleCallback started');
    console.log('🔍 Current location.search:', location.search);
    const query = new URLSearchParams(location.search);
    const provider = query.get('provider');
    const email = query.get('email');
    const requiresVerification = query.get('requiresVerification') === 'true';
    const isNewUser = query.get('isNewUser') === 'true';
    const error = query.get('error');
    const message = query.get('message');

    if (error) {
      console.error('OAuth error:', message);
      setError(decodeURIComponent(message) || 'Failed to process social signup');
      setStep('register');
      setIsProcessingCallback(false);
      setLoading(false);
      return;
    }

    if (!provider || !email || isProcessingCallback) {
      console.log('🚫 Missing provider, email, or already processing');
      return;
    }

    setIsProcessingCallback(true);
    setLoading(true);
    setError('');

    try {
      if (requiresVerification) {
        console.log('🔄 Transitioning to social-verify step for email:', email);
        setSocialEmail(decodeURIComponent(email));
        setSocialProvider(provider);
        setStep('social-verify');
        
      } else {
        console.log('✅ No verification required, attempting login');
        // For verified users, the backend should provide a token
        // const token = query.get('token');
        // if (!token) {
        //   throw new Error('No token provided for verified user');
        // }
        // await socialLogin({ token, user: { email: decodeURIComponent(email), isVerified: true } });
        alert('Social login successful!');
        navigate('/login');
      }
    } catch (error) {
      console.error('Social callback error:', error);
      setError(error.message || 'Failed to process social signup');
      setStep('register');
    } finally {
      setIsProcessingCallback(false);
      setLoading(false);
    }
  };

  if (location.search.includes('provider') && !isProcessingCallback) {
    handleCallback();
  }
}, [location.search, navigate, socialLogin, isProcessingCallback]);

  // Improved error extraction
  const getErrorMessage = (error) => {
    if (error.response) {
      return error.response.data?.message || 
             error.response.data?.error ||
             JSON.stringify(error.response.data.data);
    }
    return error.message || 'An unexpected error occurred';
  };

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
      } else {
        throw new Error(response.message || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Verification submit (email/password signup)
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
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Social verification submit
  const handleSocialVerifySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!verificationCode) {
      setError('Please enter your verification code');
      setLoading(false);
      return;
    }

    try {
      console.log('social verification code', verificationCode)
      const response = await verifySocialUser({
        email: socialEmail,
        code: verificationCode,
        provider: socialProvider,
      });
      console.log('social verification response', response)

      if (response.status === 200) {
        await socialLogin(response.data);
        setVerificationCode('');
        setSocialEmail('');
        setSocialProvider('');
        navigate('/login');
      } else {
        throw new Error(response.message || 'Social verification failed');
      }
    } catch (error) {
      console.error('Social verification error:', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Social signup handler
  const handleSocialSignup = async (platform) => {
    setSocialLoading((prev) => ({ ...prev, [platform]: true }));
    setSocialError('');

    try {
      const response = await initiateSocialSignup(platform);
      console.log("signup response", response)

      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('No redirect URL received');
      }
    } catch (error) {
      console.error(`Error initiating ${platform} signup:`, error);
      setSocialError(`Failed to initiate ${platform} signup`);
    } finally {
      setSocialLoading((prev) => ({ ...prev, [platform]: false }));
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <Header />
      {isProcessingCallback ? (
        <div className="flex-grow flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-indigo-700 font-medium">Processing social login...</p>
        </div>
      ) : (
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
                loading={socialLoading}
                error={socialError}
              />
            </>
          ) : step === 'verify' ? (
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

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify Social Account'}
              </button>
            </form>
          ): null }

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
      )}
      <div className="mt-auto w-full flex justify-center items-center text-gray-500 text-sm">
        <Footer />
      </div>
    </div>
  );
};

export default SignUp;