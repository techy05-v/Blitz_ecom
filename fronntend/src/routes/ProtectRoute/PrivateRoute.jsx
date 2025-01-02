// PrivateRoute.jsx
import React from 'react';
import Cookies from "js-cookie";
import { jwtDecode as jwt_decode } from "jwt-decode";
import { Navigate, Outlet } from "react-router-dom";
import { updateBlockStatus } from "../../redux/slice/UserSlice";
import { useDispatch } from "react-redux";

const PrivateRoute = ({ allowedRole, redirectTo, children }) => {
    const dispatch = useDispatch();

    const getRoleFromToken = (token) => {
        if (!token) {
            console.warn("No token provided for decoding.");
            return null;
        }
        try {
            const decoded = jwt_decode(token);
            
            if (decoded?.data?.role === "user" && decoded?.data?.isBlocked) {
                Cookies.remove(`${allowedRole}_access_token`);
                Cookies.remove(`${allowedRole}RefreshToken`);
                localStorage.removeItem("userData");
                localStorage.removeItem("activeItem");
                
                dispatch(updateBlockStatus({ isBlocked: true }));
                return null;
            }
            return decoded?.data?.role;
        } catch (error) {
            console.error("Error decoding token:", error);
            return null;
        }
    };

    const accessToken = Cookies.get(`${allowedRole}_access_token`);
    const userRole = getRoleFromToken(accessToken);
    const isAuthorized = allowedRole === userRole;

    if (!isAuthorized) {
        return <Navigate to={redirectTo} replace />;
    }

    return children || <Outlet />;
};

export default PrivateRoute;