import { axiosInstance } from "../../api/axiosConfig";

const cartService = {
    // Add item to cart
    addToCart: async ({ productId, quantity, size }) => {
        try {
            // Debug logs
            console.log('Current headers:', axiosInstance.defaults.headers);
            console.log('Adding to cart:', { productId, quantity, size });
            
            const response = await axiosInstance.post('/user/cart/add', {
                productId,
                quantity,
                size
            });
            
            console.log('Cart response:', response.data);
            return response.data;
        } catch (error) {
            // Log the error details
            console.log('Error config:', error.config);
            console.log('Error response:', error.response);
            
            throw error.response?.data || {
                success: false,
                message: 'Error adding item to cart'
            };
        }
    },

    // Get cart items
    getCartItems: async () => {
        try {
            const response = await axiosInstance.get('/user/cart');
            return response.data;
        } catch (error) {
            throw error.response?.data || {
                success: false,
                message: 'Error fetching cart items'
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
