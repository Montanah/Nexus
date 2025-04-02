import { useState } from 'react';
import { verifyUser } from '../Services/api';
import PropTypes from 'prop-types';

const SignupForm = ({ navigate, email, onVerificationComplete }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        email,
        code: verificationCode,
      });
  
      if (response.status === 200) {
        onVerificationComplete();
        navigate('/login');
      }
    } catch (error) {
      // ... error handling ...
    } finally {
      setLoading(false);
    }
  };  

  return (
    <form onSubmit={handleVerifySubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Enter Verification Code received via email/phone number entered
        </label>
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="Enter your 6-digit code"
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
        {loading ? 'Processing...' : 'Verify'}
      </button>
    </form>
  );
};

SignupForm.propTypes = {
  navigate: PropTypes.func.isRequired,
  email: PropTypes.string.isRequired,
  onVerificationComplete: PropTypes.func.isRequired,
};

export default SignupForm;