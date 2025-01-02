import axios from 'axios';
import { axiosInstance } from "../../api/axiosConfig"

// API service for category-related operations
const CategoryService = {
  // Fetch all categories
  fetchCategories: async (page = 1, limit = 10) => {
    try {
      const response = await axiosInstance.get('/admin/categories', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add a new category
  addCategory: async (categoryData) => {
    try {
      const response = await axiosInstance.post('/admin/createcategory', categoryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Toggle category status
  toggleCategoryStatus: async (categoryId) => {
    try {
      const response = await axiosInstance.put(`/admin/category/${categoryId}/toggle-status`);
      return response.data.category;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Additional methods can be added as needed
  // For example:
  updateCategory: async (categoryId, updateData) => {
    try {
      const response = await axiosInstance.put(`/admin/category/${categoryId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteCategory: async (categoryId) => {
    try {
      const response = await axiosInstance.delete(`/admin/category/${categoryId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default CategoryService;