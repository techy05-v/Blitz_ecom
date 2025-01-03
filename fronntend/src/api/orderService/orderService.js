import { axiosInstance } from "../../api/axiosConfig";

const orderService = {
    createOrder: async (orderData) => {
        try {
            const response = await axiosInstance.post('/user/order/create', orderData);
            return response.data;
        } catch (error) {
            throw error.response?.data || {
                success: false,
                message: 'Error creating order'
            };
        }
    },

    getOrderById: async (orderId) => {
        if (!orderId) {
            throw new Error('Order ID is required');
        }
        
        try {
            const response = await axiosInstance.get(`/user/orders/details/${orderId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || {
                success: false,
                message: 'Error fetching order details'
            };
        }
    },

    getUserOrders: async (params = {}) => {
        try {
            const { page = 1, limit = 10 } = params;
            const response = await axiosInstance.get(`/user/orders/my-orders?page=${page}&limit=${limit}`);
            return {
                orders: response.data.orders || [],
                totalOrders: response.data.totalOrders || 0,
                currentPage: response.data.currentPage || 1,
                totalPages: response.data.totalPages || 1
            };
        } catch (error) {
            throw error.response?.data || {
                success: false,
                message: 'Error fetching orders'
            };
        }
    },

    cancelOrder: async (orderId, reason) => {
        try {
            const response = await axiosInstance.put(`/user/orders/cancel/${orderId}`, { cancelReason: reason });
            return response.data;
        } catch (error) {
            throw error.response?.data || {
                success: false,
                message: 'Error cancelling order'
            };
        }
    }
};

export default orderService;