import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../assets/NexusLogo.png';

const SignUp = () => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    verifyPassword: ''
  });

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);

  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    verifyPassword: ''
  });

  // Social login loading and error states
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialError, setSocialError] = useState('');

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowVerifyPassword(!showVerifyPassword);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
      verifyPassword: ''
    };

    let isValid = true;

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
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

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle signup submission
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await axios.post('/register', formData);
      if (response.status === 200 || response.status === 201) {
        navigate('/login');
        setFormData({ fullName: '', email: '', phoneNumber: '', password: '', verifyPassword: '' });
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  // Handle API errors
  const handleApiError = (error) => {
    alert(
      error.response?.data?.message ||
      (error.request ? 'Network error. Please check your connection.' : 'An unexpected error occurred.')
    );
  };

  // Handle social signup (Google, Apple)
  const handleSocialSignup = async (platform) => {
    setSocialLoading(true);
    setSocialError('');

    const url = platform === 'google' 
      ? '/google' 
      : '/apple';

    try {
      const response = await axios.post(url, {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber
      });

      if (response.status === 200 || response.status === 201) {
        console.log(`${platform.charAt(0).toUpperCase() + platform.slice(1)} Signup successful`);
        navigate('/login');
      }
    } catch (err) {
      console.error(`${platform.charAt(0).toUpperCase() + platform.slice(1)} Signup Error:`, err);
      handleApiError(err);
      setSocialError('Something went wrong during social signup. Please try again.');
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
      {/* Header with Logo */}
      <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between">
        <img
          src={Logo}
          alt="Nexus Logo"
          className="w-25 h-25 ml-10 cursor-pointer"
          onClick={() => navigate('/')}
        />
      </div>

      {/* Signup Form Container */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 mt-16">
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

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          {/* Full Name */}
          <div>
            <input
              type="text"
              name="fullName"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                formErrors.fullName ? 'border-red-500' : ''
              }`}
            />
            {formErrors.fullName && (
              <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <input
              type="email"
              name="email"
              placeholder="johndoe@email.com"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                formErrors.email ? 'border-red-500' : ''
              }`}
            />
            {formErrors.email && (
              <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <input
              type="tel"
              name="phoneNumber"
              placeholder="+254712345678"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                formErrors.phoneNumber ? 'border-red-500' : ''
              }`}
            />
            {formErrors.phoneNumber && (
              <p className="text-red-500 text-sm mt-1">{formErrors.phoneNumber}</p>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                formErrors.password ? 'border-red-500' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('password')}
              className="absolute right-3 top-3 text-gray-500"
            >
              {showPassword ? '👁️' : '🙈'}
            </button>
            {formErrors.password && (
              <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
            )}
          </div>

          {/* Verify Password */}
          <div className="relative">
            <input
              type={showVerifyPassword ? 'text' : 'password'}
              name="verifyPassword"
              placeholder="Verify Password"
              value={formData.verifyPassword}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                formErrors.verifyPassword ? 'border-red-500' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('verifyPassword')}
              className="absolute right-3 top-3 text-gray-500"
            >
              {showVerifyPassword ? '👁️' : '🙈'}
            </button>
            {formErrors.verifyPassword && (
              <p className="text-red-500 text-sm mt-1">{formErrors.verifyPassword}</p>
            )}
          </div>

          {/* Signup Button */}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Sign Up
          </button>
        </form>

        {/* Social Login */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-center">
            <div className="border-t border-gray-300 grow mr-3"></div>
            <span className="text-gray-500">or continue with</span>
            <div className="border-t border-gray-300 grow ml-3"></div>
          </div>

          <div className="flex space-x-4 justify-center">
            <button
              onClick={() => handleSocialSignup('google')}
              className="flex items-center justify-center w-full py-2 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={socialLoading}
            >
              {socialLoading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-gray-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Logging in...
                </div>
              ) : (
                <>
                  <img
                    src="https://www.svgrepo.com/show/303108/google-icon-logo.svg"
                    alt="Google"
                    className="w-6 h-6 mr-2"
                  />
                  Google
                </>
              )}
            </button>

            <button
              onClick={() => handleSocialSignup('apple')}
              className="flex items-center justify-center w-full py-2 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={socialLoading}
            >
              {socialLoading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-gray-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Logging in...
                </div>
              ) : (
                <>
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
                    alt="Apple"
                    className="w-6 h-6 mr-2"
                  />
                  Apple
                </>
              )}
            </button>
          </div>
        </div>

        {/* Terms and Conditions */}
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
      {/* Footer */}
      <footer className="absolute bottom-2 left-0 right-0 text-center text-gray-500 text-sm">
            <p>Copyright &copy; 2025 Nexus. All rights reserved.</p>
        </footer>
    </div>
  );
};

export default SignUp;