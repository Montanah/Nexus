import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import { FaCheckCircle } from 'react-icons/fa';
import { forgotPassword } from '../Services/api';

const EmailSentConfirmation = () => {
  const location = useLocation();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Get email from ForgotPassword via location.state (passed during navigation)
  const email = location.state?.email || '';

  const handleResendEmail = async () => {
    setMessage('');
    setError('');
    setLoading(true);

    if (!email) {
      setError('No email provided. Please go back and try again.');
      setLoading(false);
      return;
    }

    try {
      await forgotPassword(email);
      setMessage('Email resent successfully! Please check your inbox.');
    } catch (err) {
      setError('Failed to resend email. Please try again.');
      console.error('Resend email error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      {/* Header */}
      <Header />

      {/* Email Sent Confirmation Content */}
      <div className="flex-grow flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
          {/* Success Graphic */}
          <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-6" />

          {/* Title */}
          <h2 className="text-3xl font-bold text-indigo-900 mb-4">Check Your Email!</h2>

          {/* Message */}
          <p className="text-gray-600 text-sm mb-6">
            Thanks! An email was sent that will ask you to click on a link to verify that you own this account. If you don’t get the email, please contact{' '}
            <a href="mailto:support@nexus.com" className="text-indigo-600 hover:underline">
              support@nexus.com
            </a>.
          </p>

          {/* Feedback Messages */}
          {message && <p className="text-green-500 text-sm mb-4">{message}</p>}
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          {/* Resend Email Button */}
          <button
            onClick={handleResendEmail}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-lg text-base disabled:bg-indigo-400"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Resend Email'}
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

export default EmailSentConfirmation;