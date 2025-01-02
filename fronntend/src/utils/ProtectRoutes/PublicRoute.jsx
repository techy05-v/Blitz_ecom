/* eslint-disable react/prop-types */
import Cookies from "js-cookie";
import {jwtDecode as jwt_decode} from "jwt-decode";
import { Navigate } from "react-router-dom";

const PublicRoute = ({ children }) => {
  const getRoleFromToken = (token) => {
    if (!token) return null;
    try {
      const decoded = jwt_decode(token);
      return decoded?.data?.role;
    } catch (error) {
      console.log("Role getting from token error:", error);
      return null;
    }
  };

  const userToken = Cookies.get("user_access_token");
  const adminToken = Cookies.get("admin_access_token");
console.log("usertoken",userToken," ", "admintoken ",adminToken)
  const userRole = getRoleFromToken(userToken);
  const adminRole = getRoleFromToken(adminToken);

  console.log(userRole,  adminRole);

  if (userRole === "user") {
    return <Navigate to="/user/home" replace />;
  }


  if (adminRole === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;