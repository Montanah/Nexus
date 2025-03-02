import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
        try {
          const response = await axios.get(`/api/user/${storedUserId}`);
          setUser(response.data); // e.g., { name, email, phonenumber }
        } catch (err) {
          console.error('Failed to fetch user details:', err);
          setUserId(null);
          localStorage.removeItem('userId');
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const baseUrl = import.meta.env.VITE_API_KEY;
      const response = await axios.post(`${baseUrl}/auth/login`, { email, password });
      const { userId, userData, token, is2FAEnabled } = response.data;
      setUserId(userId);
      setUser(userData);
      localStorage.setItem('userId', userId);
      return { success: true, is2FAEnabled, userId }; // Return 2FA status
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const socialLogin = async (userId, userData) => {
    try {
      setLoading(true);
      setUserId(userId);
      setUser(userData);
      localStorage.setItem('userId', userId);
      return true;
    } catch (err) {
      console.error('Social login error:', err);
      throw new Error('Social login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/logout');
      setUserId(null);
      setUser(null);
      localStorage.removeItem('userId');
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      return { success: false, error: 'Logout failed' };
    }
  };

  const value = {
    userId,
    user,
    login,
    socialLogin,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};