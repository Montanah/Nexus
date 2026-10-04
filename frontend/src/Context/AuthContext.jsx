import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import api, { authSession, loginUser, verifyLoginOTP, logoutUser, fetchUserData } from '../Services/api';

const AuthContext = createContext();
const readProfile = async userId => {
  const response = await fetchUserData(userId);
  const profile = response?.data?.user;
  if (!profile || profile._id !== userId) throw new Error('Account details could not be confirmed.');
  return profile;
};
const readSession = async () => {
  const response = await api.get('/api/auth/get-user-id', { timeout: 15000 });
  const userId = response.data?.data;
  if (typeof userId !== 'string' || !userId) throw new Error('Account details could not be confirmed.');
  return readProfile(userId);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionError, setSessionError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const currentUserId = useRef(null);
  const verifiedUserId = useRef(null);
  const operation = useRef(0);
  const mounted = useRef(true);
  const userId = user?._id || null;

  const clearError = () => setError(null);
  const updateProfile = profile => setUser(previous => previous ? { ...previous, ...profile } : previous);
  const applySession = profile => {
    setUser(profile);
    setSessionError(null);
    setSessionExpired(false);
    currentUserId.current = null;
    verifiedUserId.current = null;
  };

  const checkAuth = useCallback(async () => {
    const version = ++operation.current;
    setLoading(true);
    setSessionError(null);
    try {
      const profile = await readSession();
      if (mounted.current && version === operation.current) applySession(profile);
    } catch (failure) {
      if (mounted.current && version === operation.current && !failure.isSessionExpired) {
        setSessionError('We couldn’t check your session. Check your connection and try again.');
      }
    } finally {
      if (mounted.current && version === operation.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const unsubscribe = authSession.subscribe(() => {
      operation.current += 1;
      setUser(null);
      currentUserId.current = null;
      verifiedUserId.current = null;
      setSessionExpired(true);
      setSessionError(null);
      setError(null);
      setLoading(false);
    });
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, []);

  const login = async (email, password, verificationCode = null, pendingUserId = null) => {
    const version = ++operation.current;
    setLoading(true);
    setError(null);
    try {
      if (!verificationCode) {
        verifiedUserId.current = null;
        const response = await loginUser({ email, password });
        const id = response?.data?.userId;
        if (!id) throw new Error('Login could not be confirmed.');
        if (!mounted.current || version !== operation.current) throw new Error('Please try signing in again.');
        currentUserId.current = id;
        return { success: true, step: 'otp', userId: id };
      }
      const id = currentUserId.current || pendingUserId;
      if (!id) throw new Error('Please enter your email and password again.');
      if (verifiedUserId.current !== id) {
        await verifyLoginOTP({ userId: id, verificationCode });
        if (!mounted.current || version !== operation.current) throw new Error('Please try signing in again.');
        verifiedUserId.current = id;
        authSession.reset();
      }
      const profile = await readProfile(id);
      if (!mounted.current || version !== operation.current) throw new Error('Please try signing in again.');
      applySession(profile);
      return { success: true, step: 'complete' };
    } catch (failure) {
      // A used OTP must not be submitted again just because the profile request failed.
      if (verifiedUserId.current && !failure.isSessionExpired) failure.sessionConfirmationPending = true;
      if (mounted.current && version === operation.current) setError('Login failed. Please check your details and try again.');
      throw failure;
    } finally {
      if (mounted.current && version === operation.current) setLoading(false);
    }
  };

  const logout = async () => {
    // Keep the page mounted so a failed logout preserves form data and displays its error.
    const version = ++operation.current;
    setError(null);
    try {
      await logoutUser();
      if (mounted.current && version === operation.current) applySession(null);
    } catch (failure) {
      if (mounted.current && version === operation.current) setError('We couldn’t log you out. Please try again.');
      throw failure;
    }
  };

  const socialLogin = useCallback(async () => {
    const version = ++operation.current;
    setLoading(true);
    setError(null);
    // The callback must establish server cookies. A query token/profile is not a session.
    authSession.reset();
    try {
      const profile = await readSession();
      if (!mounted.current || version !== operation.current) throw new Error('Please try signing in again.');
      applySession(profile);
      return { success: true };
    } catch (failure) {
      if (mounted.current && version === operation.current) setError('We couldn’t confirm your sign-in. Please try again.');
      throw new Error('We couldn’t confirm your sign-in. Please try again.', { cause: failure });
    } finally {
      if (mounted.current && version === operation.current) setLoading(false);
    }
  }, []);

  return <AuthContext.Provider value={{ user, userId, loading, error, sessionError, sessionExpired, clearError, login, logout, checkAuth, socialLogin, updateProfile }}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = { children: PropTypes.node.isRequired };

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
