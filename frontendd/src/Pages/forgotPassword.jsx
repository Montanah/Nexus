import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import { requestPasswordReset } from '../Services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordReset = async () => {
    setMessage('');
    setError('');

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    try {
      const response = await requestPasswordReset(email);
      if (response.status === 200) { // Check response.status if API returns it in data
        setMessage('Password reset instructions have been sent to your email.');
      } else {
        setMessage(response.message || 'Password reset instructions have been sent to your email.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to send reset instructions. Please try again.');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      {/* Navbar */}
      <Header />

      {/* Forgot Password Form */}
      <div className="flex-grow flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
          <h2 className="text-3xl font-bold text-indigo-900 mb-4 text-center">Forgot Password</h2>
          <p className="text-gray-600 text-sm text-center mb-4">
            Enter your email and well send you password reset instructions.
          </p>

          {message && <p className="text-green-500 text-sm mb-4">{message}</p>}
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            onClick={handlePasswordReset}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-lg text-base"
          >
            Send Reset Instructions
          </button>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-indigo-600 text-sm hover:underline"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>

      {/* Footer - Centered at Bottom */}
      <div className="mt-auto w-full flex justify-center items-center text-gray-500 text-sm">
        <Footer />
      </div>
    </div>
  );
};

export default ForgotPassword;