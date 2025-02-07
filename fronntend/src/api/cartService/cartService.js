import { axiosInstance } from "../../api/axiosConfig";
import Cookies from "js-cookie";
const debugLog = (action, data) => {
    console.group(`Cart Service Debug - ${action}`);
    console.log(data);
    console.groupEnd();
};
const cartService = {
    // Add item to cart
    addToCart: async ({ productId, quantity, size }) => {
        debugLog('Add to Cart - Start', { productId, quantity, size });
        
        try {
            // Check authentication
            const userToken = Cookies.get("user_access_token");
            debugLog('Auth Token', { exists: !!userToken, token: userToken });

            if (!userToken) {
                throw new Error("Authentication token missing");
            }

            // Log request configuration
            debugLog('Request Config', {
                url: `${axiosInstance.defaults.baseURL}/user/cart/add`,
                headers: axiosInstance.defaults.headers,
                data: { productId, quantity, size }
            });

            const response = await axiosInstance.post('/user/cart/add', {
                productId,
                quantity,
                size
            });
            
            debugLog('Success Response', response.data);
            return response.data;
        } catch (error) {
            debugLog('Error Details', {
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers,
                    baseURL: error.config?.baseURL
                },
                response: {
                    status: error.response?.status,
                    data: error.response?.data,
                    headers: error.response?.headers
                },
                message: error.message
            });

            if (error.response?.status === 404) {
                throw {
                    success: false,
                    message: "Cart endpoint not found. Please check API configuration.",
                    code: "ENDPOINT_NOT_FOUND",
                    details: {
                        url: error.config?.url,
                        baseURL: axiosInstance.defaults.baseURL
                    }
                };
            }

            if (error.response?.status === 401) {
                throw {
                    success: false,
                    message: "Please login to continue",
                    code: "AUTH_REQUIRED"
                };
            }

            throw {
                success: false,
                message: error.response?.data?.message || "Error adding item to cart",
                code: error.response?.status ? `HTTP_${error.response.status}` : 'UNKNOWN_ERROR',
                details: error.response?.data
            };
        }
    },

    // Get cart items
    getCartItems: async () => {
        debugLog('Get Cart - Start', { 
            baseURL: axiosInstance.defaults.baseURL,
            token: !!Cookies.get("user_access_token")
        });

        try {
            const response = await axiosInstance.get('/user/cart');
            debugLog('Get Cart - Success', response.data);
            return response.data;
        } catch (error) {
            debugLog('Get Cart - Error', {
                status: error.response?.status,
                message: error.response?.data?.message,
                config: error.config
            });

            // Handle empty cart case
            if (error.response?.status === 404) {
                return {
                    success: true,
                    message: "Cart is empty",
                    cart: {
                        items: [],
                        totalAmount: 0
                    }
                };
            }

            throw {
                success: false,
                message: error.response?.data?.message || "Error fetching cart items",
                code: error.response?.status ? `HTTP_${error.response.status}` : 'UNKNOWN_ERROR',
                details: error.response?.data
            };
        }
    },
    // Update cart item quantity
    updateCartItem: async ({ productId, quantity, size }) => {
        try {
            const response = await axiosInstance.put('/user/cart/update', {
                productId,
                quantity,
                size
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || {
                success: false,
                message: 'Error updating cart item'
            };
        }
    },

    // Remove item from cart
    removeFromCart: async ({ productId, size }) => {
        try {
            const response = await axiosInstance.delete('/user/cart/remove', {
                data: { productId, size }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || {
                success: false,
                message: 'Error removing item from cart'
            };
        }
    },

    // Clear entire cart
    clearCart: async () => {
        try {
            const response = await axiosInstance.delete('/user/cart/clear');
            return response.data;
        } catch (error) {
            throw error.response?.data || {
                success: false,
                message: 'Error clearing cart'
            };
        }
    }
};

export default cartService;
