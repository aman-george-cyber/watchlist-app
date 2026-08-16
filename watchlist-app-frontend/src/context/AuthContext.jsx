import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

// Safe JWT payload parser helper
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || null);
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const storedAccess = localStorage.getItem('accessToken');
      const storedRefresh = localStorage.getItem('refreshToken');

      if (storedAccess) {
        const decoded = parseJwt(storedAccess);
        if (decoded) {
          // Check expiration if 'exp' is present
          const currentTime = Date.now() / 1000;
          if (decoded.exp && decoded.exp < currentTime) {
            // Token expired, wait for axios interceptor to refresh on first request or check refresh token
            if (!storedRefresh) {
              logout();
              setLoading(false);
              return;
            }
          }
          setUser(decoded);
          setAccessToken(storedAccess);
          setRefreshToken(storedRefresh);
        } else {
          logout();
        }
      } else {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
      }
      setLoading(false);
    };

    initAuth();

    const handleAuthLogout = () => {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('token/', { username, password });
      const { access, refresh } = response.data;

      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);

      const decoded = parseJwt(access) || { username };
      setUser(decoded);
      setAccessToken(access);
      setRefreshToken(refresh);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Invalid username or password';
      return { success: false, message };
    }
  };

  const register = async (username, password, confirmPassword) => {
    try {
      await api.post('register/', {
        username,
        password,
        password_confirm: confirmPassword,
      });

      // Automatically log the user in after successful registration
      return await login(username, password);
    } catch (error) {
      console.error('Registration error:', error);
      const data = error.response?.data;
      let message = 'Registration failed. Please try again.';

      if (data) {
        if (typeof data === 'string') {
          message = data;
        } else if (data.detail) {
          message = data.detail;
        } else if (data.username) {
          message = Array.isArray(data.username) ? data.username[0] : data.username;
        } else if (data.password) {
          message = Array.isArray(data.password) ? data.password[0] : data.password;
        } else if (data.password_confirm) {
          message = Array.isArray(data.password_confirm) ? data.password_confirm[0] : data.password_confirm;
        } else if (data.non_field_errors) {
          message = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        }
      }

      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!accessToken && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
