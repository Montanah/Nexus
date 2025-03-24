import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import { resetPassword } from '../Services/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password strength logic (basic example)
  const getPasswordStrength = (password) => {
    if (password.length === 0) return { text: '', color: '' };
    if (password.length < 6) return { text: 'Weak', color: 'text-red-500' };
    if (password.length < 10 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { text: 'Moderate', color: 'text-yellow-500' };
    return { text: 'Strong', color: 'text-green-500' };
  };
  const strength = getPasswordStrength(newPassword);

  const handleResetPassword = async () => {
    setMessage('');
    setError('');
    setLoading(true);

    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      // Assuming a token is passed via URL (e.g., /reset-password?token=xyz)
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        setError('Invalid or missing reset token.');
        setLoading(false);
        return;
      }

      await resetPassword(token, newPassword);
      setMessage('Password successfully reset! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000); // Redirect after 2 seconds
    } catch (err) {
      setError('Failed to reset password. Please try again.');
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      {/* Header */}
      <Header />

      {/* Reset Password Form */}
      <div className="flex-grow flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
          <h2 className="text-3xl font-bold text-indigo-900 mb-2 text-center">Reset Password</h2>
          <p className="text-gray-600 text-sm text-center mb-6">
            Please kindly set your new password
          </p>

          {message && <p className="text-green-500 text-sm mb-4 text-center">{message}</p>}
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

          {/* New Password */}
          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-gray-700 font-medium mb-1">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            {/* Password Strength Indicator */}
            {newPassword && (
              <p className={`text-sm mt-1 ${strength.color}`}>
                Strength: {strength.text}
              </p>
            )}
          </div>

          {/* Re-Enter Password */}
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-1">
              Re-Enter Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleResetPassword}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-lg text-base disabled:bg-indigo-400"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>

      {/* Footer - Centered at Bottom */}
      <div className="mt-auto w-full flex justify-center items-center text-gray-500 text-sm">
        <Footer />
      </div>
    </div>
  );
};

export default ResetPassword;