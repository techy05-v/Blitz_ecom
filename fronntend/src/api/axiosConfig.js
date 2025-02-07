// axiosConfig.js
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "sonner";

const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

// Debug logger
const debugLog = (context, data) => {
    console.group(`Axios Debug - ${context}`);
    console.log(data);
    console.groupEnd();
};

const createAxiosInstance = (contentType = "application/json") => {
    const instance = axios.create({
        baseURL,
        headers: {
            "Content-Type": contentType,
        },
        withCredentials: true,
    });

    // Request Interceptor
    instance.interceptors.request.use(
        (config) => {
            // Skip token for cloudinary requests
            if (config.url?.includes("cloudinary.com")) {
                config.withCredentials = false;
                return config;
            }
            
            const adminAccessToken = Cookies.get("admin_access_token");
            const userAccessToken = Cookies.get("user_access_token");
            
            debugLog("Auth Tokens", {
                userToken: userAccessToken ? "exists" : "none",
                adminToken: adminAccessToken ? "exists" : "none"
            });
            
            const token = adminAccessToken || userAccessToken || null;
            
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                debugLog("Request Headers", {
                    url: config.url,
                    authorization: config.headers.Authorization
                });
            } else {
                debugLog("No Auth Token", { url: config.url });
            }
            
            return config;
        },
        (error) => {
            debugLog("Request Error", error);
            return Promise.reject(error);
        }
    );

    // Response Interceptor
    instance.interceptors.response.use(
        (response) => response,
        async (error) => {
            try {
                const originalRequest = error.config;
                
                // Token expired handling
                if (
                    error.response?.status === 401 &&
                    error.response?.data?.message === "Token is invalid or expired." &&
                    !originalRequest?._retry
                ) {
                    originalRequest._retry = true;

                    try {
                        debugLog("Attempting Token Refresh", { originalUrl: originalRequest.url });
                        
                        const response = await instance.post(
                            "/auth/refreshtoken",
                            {},
                            { withCredentials: true }
                        );
                        
                        const { role, access_token } = response.data;
                        
                        if (access_token) {
                            // Set new token
                            Cookies.set(`${role}_access_token`, access_token, {
                                expires: 13 / (24 * 60), // 13 minutes
                                secure: true,
                                sameSite: 'Lax'
                            });

                            originalRequest.headers.Authorization = `Bearer ${access_token}`;
                            return instance(originalRequest);
                        }
                    } catch (refreshError) {
                        handleAuthError();
                        return Promise.reject(refreshError);
                    }
                }

                // User blocked
                if (error.response?.status === 401 && error.response?.data?.message === "User Blocked.") {
                    toast.warning("You have been blocked by an admin.");
                    handleAuthError("user");
                    return Promise.reject(error);
                }

                // No token or invalid token
                if (
                    error.response?.status === 403 ||
                    (error.response?.status === 400 && error.response?.data?.message === "Invalid token format.")
                ) {
                    toast.info("Your session has expired. Please sign in again.");
                    handleAuthError();
                    return Promise.reject(error);
                }

                return Promise.reject(error);
            } catch (interceptorError) {
                console.error("Error in interceptor:", interceptorError);
                return Promise.reject(error);
            }
        }
    );

    return instance;
};

// Helper function to handle auth errors
const handleAuthError = (role = "user") => {
    Cookies.remove("admin_access_token");
    Cookies.remove("user_access_token");
    
    const redirectPath = role === "admin" ? "/admin/login" : "/user/login";
    window.location.href = redirectPath;
};

const axiosInstance = createAxiosInstance();
const axiosMultipartInstance = createAxiosInstance("multipart/form-data");

export { axiosInstance, axiosMultipartInstance };