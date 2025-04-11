import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import api, { loginUser, verifyLoginOTP, logoutUser, fetchUserData } from '../Services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const [user, setUser] = useState(null);

  // Check auth status by calling /api/auth/me
  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/auth/get-user-id');
      setUserId(response.data.data);
      console.log('User data:', response.data.data);
    } catch (error) {
      setUserId(null);
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
        console.log('Fetched user data:', userData);
        setUser(userData);
        // console.log(document.cookie);
        // setCurrentUserId(null);
        return { success: true, step: 'complete' };
      }
  
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setCurrentUserId(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    userId,
    loading,
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