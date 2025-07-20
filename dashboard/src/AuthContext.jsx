// AuthContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getCurrentAdmin, isAuthenticated, initializeAuth } from './api';

// Auth context
const AuthContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        admin: action.payload,
        loading: false,
        error: null
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        admin: null,
        loading: false,
        error: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'INITIALIZE':
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        admin: action.payload.admin,
        loading: false
      };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  isAuthenticated: false,
  admin: null,
  loading: true,
  error: null
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth on app load
  useEffect(() => {
    const initAuth = () => {
      try {
        initializeAuth();
        const isAuth = isAuthenticated();
        const admin = getCurrentAdmin(); 
        
        dispatch({
          type: 'INITIALIZE',
          payload: {
            isAuthenticated: isAuth,
            admin: admin
          }
        });
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({
          type: 'INITIALIZE',
          payload: {
            isAuthenticated: false,
            admin: null
          }
        });
        dispatch({
          type: 'SET_ERROR',
          payload: 'Failed to initialize authentication. Please log in again.'
        });
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = (adminData) => {
    dispatch({
      type: 'LOGIN',
      payload: adminData
    });
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    dispatch({ type: 'LOGOUT' });
  };

  // Set loading
  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  // Set error
  const setError = (error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const value = {
    ...state,
    login,
    logout,
    setLoading,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC for protected routes
export const withAuth = (Component) => {
  return (props) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      return <LoginPage {...props} />;
    }
    
    return <Component {...props} />;
  };
};

// Permission checker component
export const PermissionGuard = ({ permission, children, fallback = null }) => {
  const { admin } = useAuth();
  
  if (!admin) return fallback;
  
  const hasPermission = admin.permissions.includes('all') || admin.permissions.includes(permission);
  
  return hasPermission ? children : fallback;
};

// Role checker component
export const RoleGuard = ({ role, children, fallback = null }) => {
  const { admin } = useAuth();
  
  if (!admin) return fallback;
  
  const hasRole = admin.role === role || admin.role === 'superadmin';
  
  return hasRole ? children : fallback;
};