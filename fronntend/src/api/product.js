import { axiosInstance } from "../api/axiosConfig";
import axios from 'axios';
const handleAxiosError = (error) => {
  if (error.response) {
    return `Request failed with status ${error.response.status}: ${error.response.data}`;
  } else if (error.request) {
    return 'No response received from server';
  } else {
    return `Error setting up request: ${error.message}`;
  }
};

export async function fetchProducts(sortOrder, searchQuery, page = 1, limit = 12) {
    try {
      console.log('Fetching products with pagination...');
      const queryParams = new URLSearchParams();
      
      // Add all query parameters
      if (sortOrder) {
        queryParams.append("sort", sortOrder);
      }
      if (searchQuery) {
        queryParams.append("search", searchQuery);
      }
      queryParams.append("page", page);
      queryParams.append("limit", limit);

      const url = `/user/products?${queryParams.toString()}`;
      const response = await axiosInstance.get(url);
      console.log('Full API Response:', response);
      
      // Return both products and pagination data
      return {
        activeProducts: Array.isArray(response.data.activeProducts) 
          ? response.data.activeProducts 
          : [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(response.data.totalProducts / limit),
          totalProducts: response.data.totalProducts,
          productsPerPage: limit
        }
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error(handleAxiosError(error));
    }
}


export async function fetchPublicProducts(limit = 4) {
  try {
    // Create a basic axios instance without interceptors
    const publicAxios = axios.create({
      baseURL: axiosInstance.defaults.baseURL
    });

    const queryParams = new URLSearchParams({
      page: 1,
      limit: limit
    });

    const url = `/user/allproducts?${queryParams.toString()}`;
    const response = await publicAxios.get(url);
    
    return {
      activeProducts: Array.isArray(response.data.activeProducts) 
        ? response.data.activeProducts 
        : [],
      pagination: response.data.pagination || null
    };
  } catch (error) {
    console.error('Error fetching public products:', error);
    throw new Error(handleAxiosError(error));
  }
}

export async function fetchCategories() {
  try {
    const { data } = await axiosInstance.get('/user/categories');
    return data;
  } catch (error) {
    throw new Error(handleAxiosError(error));
  }
}

export async function fetchBrands() {
  try {
    const { data } = await axiosInstance.get('/brands');
    return data;
  } catch (error) {
    throw new Error(handleAxiosError(error));
  }
}

export { handleAxiosError };