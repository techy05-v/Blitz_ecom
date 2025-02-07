import { axiosInstance } from '../../api/axiosConfig';
import Cookies from 'js-cookie';

const WISHLIST_API = {
  ADD: '/user/add',
  REMOVE: '/user/remove',
  GET: '/user/getwishlist',
  CLEAR: '/user/clearwishlist'
};

export const wishlistAPI = {
  addToWishlist: async (productId) => {
    // Check if user is authenticated
    const token = Cookies.get('user_access_token');
    if (!token) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await axiosInstance.post(WISHLIST_API.ADD, {
        productId: productId
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
    // Check if user is authenticated
    const token = Cookies.get('user_access_token');
    if (!token) {
      throw new Error('User not authenticated');
    }

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
    // Check if user is authenticated
    const token = Cookies.get('user_access_token');
    if (!token) {
      throw new Error('User not authenticated');
    }

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
    // Check if user is authenticated
    const token = Cookies.get('user_access_token');
    if (!token) {
      throw new Error('User not authenticated');
    }

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