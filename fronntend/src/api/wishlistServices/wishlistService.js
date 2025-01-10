import { axiosInstance } from '../../api/axiosConfig';

const WISHLIST_API = {
  ADD: '/user/add',
  REMOVE: '/user/remove',
  GET: '/user/getwishlist',
  CLEAR: '/user/clearwishlist'
};

export const wishlistAPI = {
  addToWishlist: async (productId) => {
    try {
      const response = await axiosInstance.post(WISHLIST_API.ADD, {
        productId: productId // Send in the format expected by backend
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to add to wishlist');
      }
      
      return response.data.wishlist;
    } catch (error) {
      throw error.response?.data || {
        message: error.message || 'Error adding to wishlist',
        success: false
      };
    }
  },

  removeFromWishlist: async (productId) => {
    try {
      const response = await axiosInstance.delete(`${WISHLIST_API.REMOVE}/${productId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to remove from wishlist');
      }
      
      return response.data.success;
    } catch (error) {
      throw error.response?.data || {
        message: error.message || 'Error removing from wishlist',
        success: false
      };
    }
  },

  getWishlist: async () => {
    try {
      const response = await axiosInstance.get(WISHLIST_API.GET);
      
      if (!response.data.success) {
        return []; // Return empty array if no wishlist found
      }
      
      return response.data.wishlist?.products || [];
    } catch (error) {
      throw error.response?.data || {
        message: error.message || 'Error fetching wishlist',
        success: false
      };
    }
  },

  clearWishlist: async () => {
    try {
      const response = await axiosInstance.delete(WISHLIST_API.CLEAR);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to clear wishlist');
      }
      
      return response.data.success;
    } catch (error) {
      throw error.response?.data || {
        message: error.message || 'Error clearing wishlist',
        success: false
      };
    }
  }
};