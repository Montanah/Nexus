import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/NexusLogo.png';

const Login = () => {
  const navigate = useNavigate();

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginRole, setLoginRole] = useState('');

  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
    role: ''
  });

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Validate form
  const validateForm = () => {
    const errors = {
      email: '',
      password: '',
      role: ''
    };

    let isValid = true;

    if (!email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }

    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    }

    if (!loginRole) {
      errors.role = 'Please select a login role';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Handle login submission
  const handleLogin = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Perform login logic here
    console.log('Login successful', {
      email,
      role: loginRole
    });

    // Navigate to appropriate dashboard based on role
    navigate(loginRole === 'client' ? '/client-dashboard' : '/traveler-dashboard');
  };

  // Social login handlers
  const handleGoogleLogin = () => {
    console.log('Google Login');
  };

  const handleAppleLogin = () => {
    console.log('Apple Login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
        {/* Header with Logo */}
              <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between">
                <img
                  src={Logo}
                  alt="Nexus Logo"
                  className="w-25 h-25 ml-10 cursor-pointer"
                  onClick={() => navigate('/')}
                />
              </div>
        {/* Sign Up Link */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate('/signup')}
            className="text-indigo-600 hover:underline transition-colors text-sm ml-43"
          >
            Don't have an account? Sign Up
          </button>
        </div>

        {/* Login Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-indigo-900 mb-2 drop-shadow-lg text-center">
            Welcome back
          </h2>
          <p className="text-gray-600 text-sm text-center">
            Enter your details to sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <input
              type="email"
              placeholder="Email Address"
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
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-3 text-gray-500"
            >
              {showPassword ? '👁️' : '🙈'}
            </button>
            {formErrors.password && (
              <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2 justify-between">
            <p className="text-gray-700">Login as:</p>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="client"
                  checked={loginRole === 'client'}
                  onChange={() => setLoginRole('client')}
                  className="mr-2"
                />
                Client
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="traveler"
                  checked={loginRole === 'traveler'}
                  onChange={() => setLoginRole('traveler')}
                  className="mr-2"
                />
                Traveler
              </label>
            </div>
            {formErrors.role && (
              <p className="text-red-500 text-sm mt-1">{formErrors.role}</p>
            )}
          </div>

          {/* Continue Button */}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Continue
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
              onClick={handleGoogleLogin}
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
              onClick={handleAppleLogin}
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
      </div>
      {/* Footer */}
        <footer className="absolute bottom-5 left-0 right-0 text-center text-gray-500 text-sm">
            <p>Copyright &copy; 2025 Nexus. All rights reserved.</p>
        </footer>
    </div>
  );
};

export default Login;