import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Cookies from 'js-cookie';

const PrivateRoute = ({ allowedRole }) => {
  // Function to check if the access token exists and is valid
  const isAuthenticated = () => {
    const accessToken = Cookies.get('accessToken');
    return !!accessToken; // Returns true if accessToken exists, false otherwise
  };

  // Function to verify the role (if needed)
  const hasRequiredRole = (role) => {
    // You might want to decode the token or check a role from your backend
    // This is a placeholder - adjust based on your authentication mechanism
    return true; // or implement actual role checking
  };

  // Check if authenticated and has the required role
  if (!isAuthenticated()) {
    // Redirect to login if no access token
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the child routes/components
  return <Outlet />;
};

export default PrivateRoute;