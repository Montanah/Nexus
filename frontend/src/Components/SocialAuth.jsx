import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { handleSocialCallback } from '../Services/api';

const SocialAuth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleSocialLogin } = useAuth();

  useEffect(() => {
    const provider = searchParams.get('provider');
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    const processSocialLogin = async () => {
      try {
        if (error) {
          throw new Error(error);
        }

        if (token && userId) {
          // User is already verified, complete login
          const userData = await handleSocialLogin(provider, code);
          navigate('/dashboard');
          return;
        }

        if (!provider || !code) {
          throw new Error('Missing authentication parameters');
        }

        const result = await handleSocialLogin(provider, code);
        
        if (result.requiresVerification) {
          // Redirect to verification page
          navigate('/signup', { 
            state: { 
              socialAuth: true,
              email: result.email,
              provider,
              requiresVerification: true,
              name: result.name || ''
            } 
          });
        } else {
          // No verification needed, go to dashboard
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Social authentication error:', error);
        navigate('/login', { 
          state: { 
            error: error.message || 'Social authentication failed' 
          } 
        });
      }
    };

    processSocialLogin();
  }, [searchParams, navigate, handleSocialLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Completing authentication...</h2>
        <p className="mt-2 text-gray-600">Please wait while we verify your account.</p>
      </div>
    </div>
  );
};

export default SocialAuth;