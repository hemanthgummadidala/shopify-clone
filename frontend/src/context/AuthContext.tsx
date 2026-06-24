import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.js';
import { trackLogin, trackSignUp } from '../services/analytics.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  apiFetch: (url: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const normalizedUrl = envUrl.replace(/\/+$/u, '');
  const apiUrl = /\/api(\/|$)/u.test(normalizedUrl) ? normalizedUrl : `${normalizedUrl}/api`;

  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return apiUrl.replace('localhost', window.location.hostname).replace('127.0.0.1', window.location.hostname);
  }

  return apiUrl;
};

export const API_BASE = getApiBase();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('shopify_token'));
  const [loading, setLoading] = useState<boolean>(true);

  // Custom fetch that automatically appends bearer token
  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'API request failed');
    }

    // Handle empty or 204 responses
    if (res.status === 204) return null;
    return res.json();
  };

  // On mount, restore session if token is present in localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('shopify_token');
      if (storedToken) {
        try {
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json'
            }
          });
          if (res.ok) {
            const userData = await res.json();
            setToken(storedToken);
            setUser(userData);
          } else {
            console.warn('Session token expired or invalid.');
            localStorage.removeItem('shopify_token');
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
          localStorage.removeItem('shopify_token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Server returned an invalid response. Please check your fields and try again.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('shopify_token', data.token);
      setToken(data.token);
      setUser(data.user);
      trackLogin('email');
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Server returned an invalid response. Please check your fields and try again.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem('shopify_token', data.token);
      setToken(data.token);
      setUser(data.user);
      trackSignUp('email');
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('shopify_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
