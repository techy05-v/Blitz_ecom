import { axiosInstance } from '../../api/axiosConfig';

const couponService = {
  // Validate a coupon code
  validateCoupon: async (code, cartTotal, userId) => {
    try {
      const response = await axiosInstance.post('/user/validate', {
        code,
        cartTotal,
        userId
      });
      return response.data;
    } catch (error) {
      // Format error response consistently
      const errorMessage = error.response?.data?.message || 'Error validating coupon';
      throw {
        message: errorMessage,
        status: error.response?.status,
        details: error.response?.data
      };
    }
  },

  // Apply a coupon to the order
  applyCoupon: async (couponData) => {
    try {
      // Validate the required fields
      if (!couponData.code || !couponData.cartTotal || !couponData.userId) {
        throw new Error('Missing required fields');
      }

      const response = await axiosInstance.post('/user/coupons/apply', {
        code: couponData.code,
        cartTotal: couponData.cartTotal,
        userId: couponData.userId
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to apply coupon');
      }

      return response.data;
    } catch (error) {
      // Structured error response
      throw {
        message: error.response?.data?.message || error.message || 'Failed to apply coupon',
        status: error.response?.status || 400,
        details: error.response?.data || {}
      };
    }
  },

  // Get list of available coupons
  listCoupons: async () => {
    try {
      const response = await axiosInstance.get('/user/coupons/list');
      if (!response.data) {
        throw new Error('No data received from coupon service');
      }
      return response.data;
    } catch (error) {
      throw {
        message: error.response?.data?.message || 'Error fetching coupons',
        status: error.response?.status || 500,
        details: error.response?.data || {}
      };
    }
  },
};

export default couponService;