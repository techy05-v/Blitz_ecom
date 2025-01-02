import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

export const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.admin);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};
export const PublicAdminRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.admin);
  const { isAuthenticated:isUserAuthenticated } = useSelector((state) => state.user);


  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if(isUserAuthenticated) {
    return <Navigate to="/user/home" replace />
  }

  return children;
};
