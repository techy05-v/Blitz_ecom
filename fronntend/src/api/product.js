import {axiosInstance} from "../api/axiosConfig";

const handleAxiosError = (error) => {
  if (error.response) {
    return `Request failed with status ${error.response.status}: ${error.response.data}`;
  } else if (error.request) {
    return 'No response received from server';
  } else {
    return `Error setting up request: ${error.message}`;
  }
};

export async function fetchProducts(sortOrder,searchQuery) {
    try {
      console.log('Fetching products...');
      const queryParams = new URLSearchParams();
      if(sortOrder){
        queryParams.append("sort",sortOrder);
      }
      if(searchQuery){
        queryParams.append("search",searchQuery)
      }
      const url=`/user/products?${queryParams.toString()}`
      const response = await axiosInstance.get(url);
      console.log('Full API Response:', response);
      
      // Assuming the products are in response.data.products
      const products = response.data.activeProducts || response.data;
      
      console.log('Extracted Products:', products);
      return Array.isArray(products) ? products : [];
    } catch (error) {
      console.error('Error fetching products:', error);
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