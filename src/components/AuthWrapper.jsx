import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthWrapper({ children, allowedRoles, guestRedirectTo }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to={guestRedirectTo || '/login'} state={{ from: location }} replace />;
  }

  const isGuestMode = user.role === 'guest' || user.email === 'guest@3kkitchen.local';
  if (isGuestMode && !allowedRoles?.includes('guest')) {
    return <Navigate to={guestRedirectTo || '/home'} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Logged in but insufficient permissions: Redirect to home
    return <Navigate to="/home" replace />;
  }

  // Authorized: Render the protected component
  return children;
}
