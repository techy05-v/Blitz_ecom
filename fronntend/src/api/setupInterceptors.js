import Cookies from "js-cookie";
import { axiosInstance } from "/src/api/axiosConfig.js";
import { toast } from "sonner";

// In setupInterceptors.js, modify the request interceptor:
const attachRequestInterceptor = (axiosCustomInstance) => {
    axiosCustomInstance.interceptors.request.use(
        (config) => {
            if (config.url?.includes("cloudinary.com")) {
                config.withCredentials = false;
                return config;
            }
            const adminAccessToken = Cookies.get("admin_access_token");
            const userAccessToken = Cookies.get("user_access_token");

            // Add these debug logs
            console.log("Admin token:", adminAccessToken);
            console.log("User token:", userAccessToken);
            
            const token = adminAccessToken || userAccessToken || null;
            console.log("Selected token:", token);

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                // Add this debug log
                console.log("Final Authorization header:", config.headers.Authorization);
            }
            return config;
        },
        (error) => Promise.reject(error)
    );
};

const attachResponseInterceptor = (axiosCustomInstance, refreshEndpoint) => {
    console.log("Attaching response interceptor...");
    
    axiosCustomInstance.interceptors.response.use(
        (response) => response,  // Simplified successful response handling
        async (error) => {
            try {
                const originalRequest = error.config;
                
                // Handle 401 with token expiration
                if (
                    error.response?.status === 401 &&
                    error.response?.data?.message === "Token is invalid or expired." &&
                    !originalRequest?._retry
                ) {
                    originalRequest._retry = true;

                    try {
                        const response = await axiosInstance.post(
                            refreshEndpoint,
                            {},
                            { withCredentials: true }
                        );
                        console.log(response)
                        const { role, access_token } = response.data;
                        
                        if (access_token) {
                            // Set the new token in cookies
                            Cookies.set(`${role}_access_token`, access_token, {
                                expires: 13 / (24 * 60), // 13 minutes
                            });

                            // Update the original request with new token
                            originalRequest.headers.Authorization = `Bearer ${access_token}`;
                            
                            // Retry the original request
                            return await axiosCustomInstance(originalRequest);
                        }
                    } catch (refreshError) {
                        // Handle refresh token failure
                        Cookies.remove("admin_access_token");
                        Cookies.remove("user_access_token");
                        
                        toast.info("Your session has expired. Please sign in again.");
                        
                        const role = error.response?.data?.role || "user";
                        const redirectPath = role === "admin" ? "/admin/login" : "/user/login";
                        window.location.href = redirectPath;
                        
                        return Promise.reject(refreshError);
                    }
                }

                // Handle 403 - No token
                if (
                    error.response?.status === 403 &&
                    error.response?.data?.message === "No token provided."
                ) {
                    toast.info("Your session has expired. Please sign in again.");
                    window.location.href = "/";
                    return Promise.reject(error);
                }

				if(error.response?.status === 401 && error.response?.data?.message === "User Blocked.")  {
					toast.warning("You have been blocked by an admin.")
					window.location.href = "/user/login"
					Cookies.remove("user_access_token")
					return Promise.reject(error)
				}
 
                // Handle 400 - Invalid token
                if (
                    error.response?.status === 400 &&
                    error.response?.data?.message === "Invalid token format."
                ) {
                    toast.info("Your session has expired. Please sign in again.");
                    window.location.href = "/";
                    return Promise.reject(error);
                }

                // Handle other errors
                return Promise.reject(error);
            } catch (interceptorError) {
                console.error("Error in interceptor:", interceptorError);
                return Promise.reject(error);
            }
        }
    );
};

export { attachRequestInterceptor, attachResponseInterceptor };