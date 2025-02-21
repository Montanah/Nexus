import { useState } from 'react'; // Use React's useState instead of Vue's ref
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/NexusLogo.png';

const SignUp = () => {
  const navigate = useNavigate();

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');

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
    let isValid = true;
    const errors = {
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
      verifyPassword: ''
    };

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required';
      isValid = false;
    }

    if (!email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }

    if (!phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
      isValid = false;
    }

    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (password !== verifyPassword) {
      errors.verifyPassword = 'Passwords do not match';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Handle signup submission
  const handleSignup = (e) => {
    e.preventDefault(); // Prevent form submission
    if (validateForm()) {
      // Perform signup logic here
      console.log('Signup successful', {
        fullName,
        email,
        phoneNumber
      });

      // Navigate to the login page after successful signup
      navigate('/login');
    }
  };

  // Social login handlers
  const handleGoogleSignup = () => {
    console.log('Google Signup');

    // Perform Google signup logic here

    // Navigate to the login page after successful signup
    navigate('/login');
  };

  const handleAppleSignup = () => {
    console.log('Apple Signup');

    // Perform Apple signup logic here

    // Navigate to the login page after successful signup
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between">
        {/* Logo with onClick navigation */}
        <img
            src={Logo}
            alt="Nexus Logo"
            className="w-25 h-25 ml-10 cursor-pointer"
            onClick={() => navigate('/')} // Navigate to home page on click
        />
    </div>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
        <div className="text-right mb-4">
          <button
            onClick={() => navigate('/login')} // Navigate to login page
            className="text-indigo-600 hover:underline"
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
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
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
              placeholder="johndoe@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              placeholder="+254712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
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
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              placeholder="Verify Password"
              value={verifyPassword}
              onChange={(e) => setVerifyPassword(e.target.value)}
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
              onClick={handleGoogleSignup}
              className="flex items-center justify-center w-full py-2 border rounded-md hover:bg-gray-100"
            >
              <img
                src="https://www.svgrepo.com/show/303108/google-icon-logo.svg"
                alt="Google"
                className="w-6 h-6 mr-2"
              />
              Google
            </button>
            <button
              onClick={handleAppleSignup}
              className="flex items-center justify-center w-full py-2 border rounded-md hover:bg-gray-100"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
                alt="Apple"
                className="w-6 h-6 mr-2"
              />
              Apple
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
    </div>
  );
};

export default SignUp;