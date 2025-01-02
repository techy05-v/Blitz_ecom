import { axiosInstance } from "../../api/axiosConfig";
import axios from "axios";

const ProductService = {
  // Fetch all categories
  getCategories: async function() {
    try {
      const response = await axiosInstance.get('/admin/categories');
      return Array.isArray(response.data) ? response.data : 
             Array.isArray(response.data.categories) ? response.data.categories : [];
    } catch (error) {
      return this.handleError(error, 'Error fetching categories');
    }
  },

  // Fetch all products
  getAllProducts: async function(page = 1, limit = 10) {
    try {
      const response = await axiosInstance.get('/admin/getallproducts', {
        params: {
          page,
          limit
        }
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Error fetching products');
    }
  },

  // Fetch single product by ID
  getProductById: async function(id) {
    if (!id) {
      throw new Error('No product ID provided');
    }

    try {
      const response = await axiosInstance.get(`/admin/getproductbyid/${id}`);
      return response.data.product;
    } catch (error) {
      return this.handleError(error, 'Error fetching single product');
    }
  },

  // Add a new product
  createProduct: async function(productData) {
    try {
      const response = await axiosInstance.post('/admin/createproduct', productData);
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Error creating product');
    }
  },

  // Update an existing product
  updateProduct: async function(productId, productData) {
    try {
      const response = await axiosInstance.put(`/admin/updateproduct/${productId}`, productData);
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Error updating product');
    }
  },

  // Delete a product
  deleteProduct: async function(productId) {
    try {
      await axiosInstance.delete(`/admin/deleteproduct/${productId}`);
      return productId;
    } catch (error) {
      return this.handleError(error, 'Error deleting product');
    }
  },

  // Soft delete (toggle product status)
  toggleProductStatus: async function(productId) {
    console.log(productId)
    try {
      const response = await axiosInstance.patch(`/admin/products/${productId}/toggle-status`);
     console.log(response,"DAAAA")
      return response.data.product;
    } catch (error) {
      return this.handleError(error, 'Error toggling product status');
    }
  },

  // Image upload to Cloudinary
  uploadImage: async function(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ecommerce");

    try {
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dnxvyozo1/image/upload",
        formData
      );
      return response.data.secure_url;
    } catch (error) {
      return this.handleError(error, 'Error uploading image');
    }
  },

  // Generic error handler
  handleError: function(error, customMessage = 'An error occurred') {
    console.error(customMessage, error);

    if (error.response) {
      // The request was made and the server responded with a status code
      throw new Error(error.response.data.message || customMessage);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response received from server');
    } else {
      // Something happened in setting up the request
      throw new Error(error.message || customMessage);
    }
  }
};

export default ProductService;