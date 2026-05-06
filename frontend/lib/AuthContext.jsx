import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '@/api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    if (api.auth.isAuthenticated()) {
      api.auth.me()
        .then(u => { setUser(u); setIsAuthenticated(true); })
        .catch(() => { api.auth.logout('/login'); })
        .finally(() => setIsLoadingAuth(false));
    } else {
      setIsLoadingAuth(false);
    }
  }, []);

  const logout = () => api.auth.logout('/login');
  const navigateToLogin = () => { window.location.href = '/login'; };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoadingAuth, logout, navigateToLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};