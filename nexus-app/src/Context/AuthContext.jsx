import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

// eslint-disable-next-line react/prop-types
export const AuthProvider = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState('landing');

  return (
    <AuthContext.Provider value={{ currentRoute, setCurrentRoute }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);