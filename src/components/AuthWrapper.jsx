import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthWrapper({ children, allowedRoles }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Not logged in: Redirect to login page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Logged in but insufficient permissions: Redirect to home
    return <Navigate to="/home" replace />;
  }

  // Authorized: Render the protected component
  return children;
}