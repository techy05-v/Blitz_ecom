// import { useLocation, Navigate } from "react-router-dom";
// import Cookies from "js-cookie";
// import { jwtDecode as jwt_decode } from "jwt-decode";
// import React from "react";

// const PublicRoute = ({ children }) => {
//   const location = useLocation();

//   // Helper function to decode the token and get the role
//   const getRoleFromToken = (token) => {
//     if (!token) {
//       console.warn("No token provided for decoding.");
//       return null;
//     }
//     try {
//       const decoded = jwt_decode(token);
//       console.log("Decoded token:", decoded);
//       return decoded?.data?.role || null;
//     } catch (error) {
//       console.error("Error decoding token:", error, "Token:", token);
//       return null;
//     }
//   };

//   // Fetch tokens from cookies
//   const userToken = Cookies.get("user_access_token");
//   const adminToken = Cookies.get("admin_access_token");

//   console.log("User Token:", userToken);
//   console.log("Admin Token:", adminToken);

//   // Extract roles from tokens
//   const userRole = getRoleFromToken(userToken);
//   const adminRole = getRoleFromToken(adminToken);

//   console.log("Extracted User Role:", userRole);
//   console.log("Extracted Admin Role:", adminRole);

//   // Check the current location
//   const adminLocation = location.pathname.startsWith("/admin");
//   const userLocation = location.pathname.startsWith("/user");

//   console.log("Current Pathname:", location.pathname);
//   console.log("Is Admin Location:", adminLocation);
//   console.log("Is User Location:", userLocation);

//   // Redirect logic with debugging
//   if (adminRole === "admin") {
//     console.log("Admin role detected.");
//     if (adminLocation) {
//       console.log("Admin is already on an admin route.");
//       return children;
//     } else {
//       console.log("Redirecting admin to dashboard.");
//       return <Navigate to="/admin/dashboard" replace />;
//     }
//   }

//   if (userRole === "user") {
//     console.log("User role detected.");
//     if (userLocation) {
//       console.log("User is already on a user route.");
//       return children;
//     } else {
//       console.log("Redirecting user to home.");
//       return <Navigate to="/user/home" replace />;
//     }
//   }

//   // Public route access
//   console.log("No specific role detected. Rendering public route.");
//   return children;
// };

// export default PublicRoute;


import { useLocation, Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import React from "react";

const PublicRoute = ({ children }) => {
  const location = useLocation();

  // Function to validate token
  const validateToken = (token) => {
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      
      // Check token expiration
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        return null;
      }

      return decoded?.data?.role || null;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  };

  // Check user and admin tokens
  const userToken = Cookies.get("user_access_token");
  const adminToken = Cookies.get("admin_access_token");

  const userRole = validateToken(userToken);
  const adminRole = validateToken(adminToken);
  console.log(userToken, userRole)

  // Redirect logic
  if (userRole === "user") {
    // // If already on a user route, allow access
    // if (location.pathname.startsWith("/user")) {
    //   return children;
    // }
    // Otherwise, redirect to user home
    return <Navigate to="/user/home" replace />;
  }

  if (adminRole === "admin") {
    // If already on an admin route, allow access
    // if (location.pathname.startsWith("/admin")) {
    //   return children;
    // }
    // Otherwise, redirect to admin dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  // If no authenticated role, render public routes
  return children;
};

export default PublicRoute;