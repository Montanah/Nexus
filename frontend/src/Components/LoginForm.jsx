import { useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import InputField from './InputField';
import propTypes from 'prop-types';

const LoginForm = ({ navigate, setStep, step }) => {
  const { login, error: authError, loading: authLoading, clearError} = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: '',
    token: '',
  });
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // In LoginForm component, update the handleCredentialSubmit:
  const handleCredentialSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError('');
    clearError();

    if (!formData.email || !formData.password || !formData.role) {
      setLocalError('Email, password, and role are required');
      setLoading(false);
      return;
    }

    try {
      const response = await login(formData.email, formData.password);
      // console.log('Login response:', response);
      if (response.success && response.step === 'otp') {
        setStep('otp'); // Update the step in parent component
      }
    } catch (err) {
      const errorMessage = err.response?.data || err.message || 'An error occurred';
      setError(errorMessage);
      // setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError('');
    clearError();

    if (!formData.token) {
      setLocalError('Please enter your 2FA code');
      setLoading(false);
      return;
    }

    try {
      const response = await login(formData.email, formData.password, formData.token);
      console.log('OTP verification response:', response);
      if (response.success && response.step === 'complete') {
        navigate(formData.role === 'client' ? '/client-dashboard' : '/traveler-dashboard');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={step === 'credentials' ? handleCredentialSubmit : handle2FASubmit} className="space-y-4">
      {/* Step-Based Heading */}
      <h2 className="text-gray-600 text-sm text-center">
        {step === 'credentials' ? 'Enter your email and password' : 'Enter the 6-digit code received via your email/phone'}
      </h2>

      {step === 'credentials' ? (
        <>
          <InputField
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
          />
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
          <div>
            <button
              onClick={() => navigate('/forgot-password')}
              className="text-indigo-700 text-sm hover:text-red-500 transition-colors"
            >
              Forgot your password?
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
          placeholder="Enter 6-digit code"
          value={formData.token}
          onChange={handleChange}
        />
      )}
      {(localError || authError) && (
        <p className="text-red-500 text-sm">{localError || authError}</p>
      )}
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

LoginForm.propTypes = {
  navigate: propTypes.func.isRequired,
  setStep: propTypes.func.isRequired,
  step: propTypes.string.isRequired,
};

export default LoginForm;
