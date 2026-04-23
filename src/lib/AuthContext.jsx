import React, { createContext, useContext, useState, useEffect } from 'react';
import { NBA_API } from './config';

const AUTH_TOKEN_KEY = 'locklab_auth_token';
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!storedToken) {
      setIsLoadingAuth(false);
      return;
    }
    fetch(`${NBA_API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then(res => {
        if (!res.ok) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          return null;
        }
        return res.json();
      })
      .then(data => { if (data) setUser(data); })
      .catch(() => {})
      .finally(() => setIsLoadingAuth(false));
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${NBA_API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (email, password, full_name) => {
    const res = await fetch(`${NBA_API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed');
    }
    const data = await res.json();
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
  };

  const updateUser = updates => setUser(prev => ({ ...prev, ...updates }));

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: null,
      login,
      register,
      logout,
      updateUser,
      navigateToLogin: () => {},
      checkAppState: () => {},
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
