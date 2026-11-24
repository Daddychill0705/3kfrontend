import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext();
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const LAST_ACTIVITY_KEY = '3k-session-last-activity';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const logout = useCallback((expired = false) => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    if (expired) localStorage.setItem('3k-session-expired', 'true');
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || Date.now();
    if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
      logout(true);
      return undefined;
    }

    localStorage.setItem(LAST_ACTIVITY_KEY, String(lastActivity));
    let timeoutId;
    const resetTimeout = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => logout(true), IDLE_TIMEOUT_MS);
    };
    const onStorage = (event) => {
      if (event.key === LAST_ACTIVITY_KEY && event.newValue) {
        const remaining = IDLE_TIMEOUT_MS - (Date.now() - Number(event.newValue));
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => logout(true), Math.max(0, remaining));
      }
    };
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((event) => window.addEventListener(event, resetTimeout, { passive: true }));
    window.addEventListener('storage', onStorage);
    resetTimeout();

    return () => {
      window.clearTimeout(timeoutId);
      activityEvents.forEach((event) => window.removeEventListener(event, resetTimeout));
      window.removeEventListener('storage', onStorage);
    };
  }, [user, logout]);

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Login failed');
    }
    
    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    localStorage.removeItem('3k-session-expired');
    setUser(data.user);
    return data.user; 
  };

  const updateUserData = (newData) => {
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
