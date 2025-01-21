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

    getAdminOrderById: async (orderId) => {
        console.log("vbcghvghfvd",orderId)
        if (!orderId) {
            throw new Error('Order ID is required');
        }
        try {
            const response = await axiosInstance.get(`/admin/orders/details/${orderId}`);
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
    },
    cancelOrderItem: async (orderId, itemId, cancelReason) => {
        console.log("Entered the function cancel order item api service-------------------------")
        if (!orderId || !itemId) {
            throw new Error('Order ID and Item ID are required');
        }
    
        try {
            console.log('Attempting to cancel item:', {
                orderId,
                itemId,
                cancelReason
            });
            
            const response = await axiosInstance.post(
                `/user/orders/${orderId}/items/${itemId}/cancel`,
                { cancelReason }
            );
            
            // console.log('Cancel item response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Cancel item error:', error);
            throw error.response?.data || {
                success: false,
                message: 'Error cancelling order item',
                error: error.message
            };
        }
    },
    verifyPayment: async (paymentData) => {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = paymentData;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            throw new Error('All payment details are required');
        }

        try {
            const response = await axiosInstance.post('/user/verify-payment', {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || {
                success: false,
                message: 'Error verifying payment',
                error: error.message
            };
        }
    }

};

export default orderService;