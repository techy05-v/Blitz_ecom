import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
export const ProtectedUserRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.user);
  console.log("-------------this is auth confirmation------",isAuthenticated);

  if (!isAuthenticated) {
    
    return <Navigate to="/user/login" replace />;
  }

  return children;
};
export const PublicUserRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.user);
  const { isAuthenticated: isAdminAuthenticated } = useSelector(
    (state) => state.admin
  );

  if (isAuthenticated) {
    return <Navigate to="/user/home" replace />;
  }

  if (isAdminAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};
