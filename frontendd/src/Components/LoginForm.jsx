import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import InputField from './InputField';

const LoginForm = ({ navigate }) => {
  const baseUrl = import.meta.env.VITE_API_KEY;
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: '',
    token: '',
  });
  const [step, setStep] = useState('credentials'); // 'credentials' or '2fa'
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(true); // Track first login

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleCredentialSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email || !formData.password || !formData.role) {
      setError('Email, password, and role are required');
      setLoading(false);
      return;
    }

    try {
      let response;
      if (isFirstLogin) {
        // First login uses /auth/loginUser
        response = await axios.post(`${baseUrl}/auth/loginUser`, { email: formData.email, password: formData.password });
        if (response.status === 200) {
          const user = response?.data?.data?.user;
          const userId = user?._id;
          // const { userId, user } = response?.data?.message;
          // setUserId(userId);
          if (!user?.isVerified) {
            setError('Account not verified. Check your email/SMS');
          } else {
            navigate('/settings', { state: { userId, role: formData.role } }); // Redirect to enable 2FA
          }
        }
      } else {
        // Subsequent logins use /auth/login + 2FA
        response = await login(formData.email, formData.password); // Assumes /auth/login returns userId
        if (response?.description === "Success") {
          setUserId(response?.data?.user?._id);
          setStep('2fa'); // Proceed to 2FA
        }
      }
    } catch (err) {

      const errorMessage = err.response?.data?.data?.message || err.response?.data?.message || 'An error occurred';
      setError(errorMessage);
      //setError(err.response?.data?.message || 'Login failed');
      if (errorMessage === 'Please enable 2FA to continue') {
        setIsFirstLogin(true); // Reset to first login flow if 2FA not enabled
      }
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.token) {
      setError('Please enter your 2FA code');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${baseUrl}/auth/verify2FA/${userId}`, { token: formData.token });
      if (response.status === 200) {
        setIsFirstLogin(false); // Mark as subsequent login
        navigate(formData.role === 'client' ? '/client-dashboard' : '/traveler-dashboard');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.data?.message || err.response?.data?.message || 'An error occurred';
      setError(errorMessage);
      //setError(err.response?.data?.message || 'Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={step === 'credentials' ? handleCredentialSubmit : handle2FASubmit} className="space-y-4">
      {step === 'credentials' ? (
        <>
          <InputField type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} />
          <div className="relative">
            <InputField
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-3 flex items-center text-gray-600"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <div className="space-y-2">
            <p className="text-gray-700">Login as:</p>
            <div className="flex space-x-4">
              {['client', 'traveler'].map((role) => (
                <label key={role} className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={formData.role === role}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </label>
              ))}
            </div>
          </div>
        </>
      ) : (
        <InputField
          type="text"
          name="token"
          placeholder="Enter 2FA Code"
          value={formData.token}
          onChange={handleChange}
        />
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </div>
        ) : (
          'Continue'
        )}
      </button>
    </form>
  );
};

export default LoginForm;