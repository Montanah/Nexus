import { useState } from 'react';
import InputField from './InputField';
import axios from 'axios';

const LoginForm = ({ navigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginRole, setLoginRole] = useState('');
  const [formErrors, setFormErrors] = useState({ email: '', password: '', role: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const validateForm = () => {
    const errors = { email: '', password: '', role: '' };
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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const baseurl = import.meta.env.VITE_API_KEY;
      const response = await axios.post(`${baseurl}/auth/login`, { email, password, role: loginRole });
      if (response.status === 200 || response.status === 201) {
        console.log('Login successful', response.data);
        navigate(loginRole === 'client' ? '/client-dashboard' : '/traveler-dashboard');
        setEmail('');
        setPassword('');
        setLoginRole('');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert(
        error.response?.data?.message ||
        (error.request ? 'Network error. Please check your connection.' : 'An unexpected error occurred.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <InputField
        type="email"
        name="email"
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={formErrors.email}
      />
      <InputField
        type="password"
        name="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={formErrors.password}
        showToggle
        toggleVisibility={togglePasswordVisibility}
        showPassword={showPassword}
      />
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
        {formErrors.role && <p className="text-red-500 text-sm mt-1">{formErrors.role}</p>}
      </div>
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 mr-3 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Logging in...
          </div>
        ) : (
          'Continue'
        )}
      </button>
    </form>
  );
};

export default LoginForm;