import { createContext, useContext, useState, useEffect } from 'react';
import api, { loginUser, verifyLoginOTP, fetchUser, logoutUser } from '../Services/api'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUserId = localStorage.getItem('userId');
      const storedToken = localStorage.getItem('authToken');
      if (storedUserId && storedToken) {
        setUserId(storedUserId);
        try {
          const response = await api.get(`/auth/user/${storedUserId}`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          setUser(response.data);
        } catch (err) {
          console.error('Failed to fetch user details:', err);
          setUserId(null);
          localStorage.removeItem('userId');
          localStorage.removeItem('authToken');
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (email, password, verificationCode = null) => {
    try {
      setLoading(true);
      if (!verificationCode) {
        const response = await loginUser({ email, password });
        const userId = response.data?.userId;
        setUserId(userId);
        localStorage.setItem('userId', userId);
        return { success: true, step: 'otp', userId };
      } else {
        const response = await verifyLoginOTP({ userId, verificationCode });
        const token = response.data?.token;
        localStorage.setItem('authToken', token);
        const userData = await fetchUser(userId, token);
        setUser(userData);
        return { success: true, step: 'complete', token };
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await logoutUser(token);
      setUserId(null);
      setUser(null);
      localStorage.removeItem('userId');
      localStorage.removeItem('authToken');
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