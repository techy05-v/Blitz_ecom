// offerApi.js


import { axiosInstance } from "../../api/axiosConfig";
const offerApi = {
    // Create new offer
    createOffer: async (offerData) => {
      try {
        const response = await axiosInstance.post('/admin/createoffer', offerData);
        return response.data;
      } catch (error) {
        throw error.response?.data || error.message;
      }
    },
  
    // Edit offer
    editOffer: async (offerId, updates) => {
      try {
        const response = await axiosInstance.put(`/admin/updateoffer/${offerId}`, updates);
        return response.data;
      } catch (error) {
        throw error.response?.data || error.message;
      }
    },
  
    // Get all offers
    getAllOffers: async () => {
      try {
        const response = await axiosInstance.get('/offers');
        return response.data;
      } catch (error) {
        throw error.response?.data || error.message;
      }
    },
  
    // Get active offers
    getActiveOffers: async () => {
      try {
        const response = await axiosInstance.get('/offers/active');
        return response.data;
      } catch (error) {
        throw error.response?.data || error.message;
      }
    },
  
    // Get offers by product
    getProductOffers: async (productId) => {
      try {
        const response = await axiosInstance.get(`/offers/product/${productId}`);
        return response.data;
      } catch (error) {
        throw error.response?.data || error.message;
      }
    },
  
    // Get offers by category
    getCategoryOffers: async (categoryId) => {
      try {
        const response = await axiosInstance.get(`/offers/category/${categoryId}`);
        return response.data;
      } catch (error) {
        throw error.response?.data || error.message;
      }
    },
  
    // Get offer by ID
    getOfferById: async (offerId) => {
      try {
        const response = await axiosInstance.get(`/offers/${offerId}`);
        return response.data;
      } catch (error) {
        throw error.response?.data || error.message;
      }
    },
  
    // Toggle offer status
    toggleOfferStatus: async (offerId) => {
      try {
        const response = await axiosInstance.patch(`/offers/${offerId}/toggle`);
        return response.data;
      } catch (error) {
        throw error.response?.data || error.message;
      }
    }
  };
  
  export default offerApi;