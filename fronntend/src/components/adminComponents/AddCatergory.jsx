import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CategoryService from '../../api/categoryServices/categoryService';

function AddCategory() {
  const [category, setCategory] = useState({
    CategoryName: '',
    description: '',
    isactive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCategory(prevCategory => ({
      ...prevCategory,
      [name]: value,
    }));
  };

  const validateCategoryName = (name) => {
    // Remove extra spaces and convert to lowercase for comparison
    return name.trim().toLowerCase();
  };

  // Just showing the modified handleSubmit function since that's where the error is
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    // Basic validation
    if (!category.CategoryName.trim()) {
      toast.error("Category Name is required");
      setLoading(false);
      return;
    }

    // Normalize the category name
    const normalizedCategoryName = validateCategoryName(category.CategoryName);

    // Check if category exists (case-insensitive)
    try {
      const response = await CategoryService.fetchCategories();
      // Add console.log to check the response structure
      console.log('API Response:', response);
      
      // Handle different possible response structures
      let existingCategories = [];
      if (Array.isArray(response)) {
        existingCategories = response;
      } else if (response.data && Array.isArray(response.data)) {
        existingCategories = response.data;
      } else if (response.categories && Array.isArray(response.categories)) {
        existingCategories = response.categories;
      }

      // Add another console.log to verify the array
      console.log('Processed Categories:', existingCategories);

      // Verify we have an array before using .some()
      if (!Array.isArray(existingCategories)) {
        console.error('Categories is not an array:', existingCategories);
        toast.error("Error processing categories data");
        setLoading(false);
        return;
      }

      const categoryExists = existingCategories.some(
        existingCat => validateCategoryName(existingCat.CategoryName) === normalizedCategoryName
      );

      if (categoryExists) {
        toast.error("This category already exists (case-insensitive match)");
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error checking existing categories:", error);
      toast.error("Error checking existing categories");
      setLoading(false);
      return;
    }

    // If validation passes, proceed with adding the category
    const response = await CategoryService.addCategory({
      ...category,
      CategoryName: category.CategoryName.trim()
    });
    
    toast.success("Category added successfully!");
    
    // Reset form
    setCategory({ 
      CategoryName: '', 
      description: '', 
      isactive: true 
    });
  } catch (err) {
    const errorMessage = err.message || "Failed to add category";
    toast.error(errorMessage);
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold mb-6">Add New Category</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label 
              className="block text-gray-700 text-sm font-bold mb-2" 
              htmlFor="CategoryName"
            >
              Category Name
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="CategoryName"
              type="text"
              placeholder="Enter category name"
              name="CategoryName"
              value={category.CategoryName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-4">
            <label 
              className="block text-gray-700 text-sm font-bold mb-2" 
              htmlFor="description"
            >
              Description
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="description"
              placeholder="Enter category description"
              name="description"
              value={category.description}
              onChange={handleChange}
              rows="4"
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="isactive"
                checked={category.isactive}
                onChange={(e) => setCategory(prev => ({
                  ...prev, 
                  isactive: e.target.checked
                }))}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-700">Active</span>
            </label>
          </div>
          
          {error && (
            <div className="mb-4 text-red-500 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <button
              className={`
                ${loading ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-700'} 
                text-white font-bold py-2 px-4 rounded 
                focus:outline-none focus:shadow-outline
              `}
              type="submit"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Category"}
            </button>
          </div>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
}

export default AddCategory;