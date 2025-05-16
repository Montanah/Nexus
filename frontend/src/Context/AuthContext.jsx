import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import api, { loginUser, verifyLoginOTP, logoutUser, fetchUserData } from '../Services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const clearError = () => setError(null);
  // Check auth status by calling /api/auth/me
  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/auth/get-user-id', { withCredentials: true });
      const fetchedUserId = response.data.data;
      console.log('checkAuth userId:', fetchedUserId);
      setUserId(fetchedUserId);

      // Fetch user data
      const userData = await fetchUserData(fetchedUserId);
      console.log('checkAuth userData:', userData);
      setUser(userData);
    } catch (error) {
      console.error('checkAuth failed:', error.response?.data || error.message);
      setUserId(null);
      setUser(null);
      if (error.response?.status === 404) {
        setError('Authentication service unavailable. Please try again later.');
      } else if (error.response?.status === 401) {
        setError('Session expired or invalid. Please log in.');
      } else {
        setError(error.response?.data?.message || 'Failed to check authentication. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password, verificationCode = null, userId = null) => {
    try {
      setLoading(true);
      setError(null);
      if (!verificationCode) {
        // First step - initiate login
        const response = await loginUser({ email, password });
    
        setCurrentUserId(response.data.userId);
        return { 
          success: true, 
          step: 'otp', 
          userId: response.data.userId 
        };
      } else {
        // Second step - verify OTP
        const userIdToVerify =  currentUserId || userId;
        console.log('User ID to verify:', userIdToVerify);
        if (!userIdToVerify) {
          throw new Error('User ID is required for OTP verification');
        }
        await verifyLoginOTP({ userId: userIdToVerify, verificationCode });
        // await checkAuth(); 

        const userData = await fetchUserData(userIdToVerify);
        console.log('Fetched user data now:', userData.data.user);
        setUser(userData.data.user);
        setUserId(userIdToVerify);
        // console.log(document.cookie);
        setCurrentUserId(null);
        return { success: true, step: 'complete' };
      }
    } catch (error) {
        console.error('Login error:', error.response?.data || error.message);
        if (error.response?.status === 404) {
        setError('Login service unavailable. Please try again later.');
      } else if (error.response?.status === 401) {
        setError('Invalid email, password, or OTP. Please try again.');
      } else {
        setError(error.response?.data?.message || 'Login failed. Please try again.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await logoutUser();
      setUser(null);
      setUserId(null);
      setCurrentUserId(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login'; 
      }
    } catch (error) {
      console.error('Logout error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Logout failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    userId,
    loading,
    error,
    clearError,
    login,
    logout,
    checkAuth 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};