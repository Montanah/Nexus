import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import axios from 'axios';

const Settings = () => {
  const { userId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [error, setError] = useState('');
  const [loginRole] = useState(location.state?.role || '');

  useEffect(() => {
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);

  const enable2FA = async () => {
    try {
      const response = await axios.post(`/auth/enable2FA/${userId}`);
      setQrCodeUrl(response.data.qrCodeUrl);
      // After enabling, prompt re-login
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enable 2FA');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center mb-6 text-indigo-900">Enable 2FA</h2>
        <p className="text-gray-600 text-sm text-center mb-4">
          Scan the QR code with your authenticator app to enable Two-Factor Authentication.
        </p>
        {!qrCodeUrl ? (
          <button
            onClick={enable2FA}
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Enable 2FA
          </button>
        ) : (
          <img src={qrCodeUrl} alt="2FA QR Code" className="w-full max-w-xs mx-auto" />
        )}
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default Settings;