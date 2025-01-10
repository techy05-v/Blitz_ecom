import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import ImageCropper from '../ImageCroper/ImageCrop';
import ProductService from '../../api/productService/productService';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    images: ['', '', '', ''],
    description: '',
    regularPrice: '',
    discountPercent: 0,
    availableSizes: [{ size: '', quantity: 0 }],
    color: '',
    tags: [],
    status: 'active',
  });

  const [currentImageIndex, setCurrentImageIndex] = useState(null);
  const [cropperVisible, setCropperVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [categoriesData, productData] = await Promise.all([
          ProductService.getCategories(),
          ProductService.getProductById(id)
        ]);
        
        setCategories(categoriesData);
        setCurrentProduct(productData);
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id]);
  // Set form data when current product is loaded
  useEffect(() => {
    if (currentProduct) {
      setFormData(prevState => ({
        ...prevState,
        ...currentProduct,
        images: currentProduct.images ? 
          [...currentProduct.images, ...Array(4 - currentProduct.images.length).fill('')] : 
          ['', '', '', ''],
        availableSizes: currentProduct.availableSizes?.length > 0 ? 
          currentProduct.availableSizes : 
          [{ size: '', quantity: 0 }],
        tags: currentProduct.tags ? currentProduct.tags.join(',') : '',
        category: currentProduct.category?._id || currentProduct.category // Use _id if available, otherwise use the whole category
      }));
    }
  }, [currentProduct]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSizeChange = (index, field, value) => {
    const updatedSizes = [...formData.availableSizes];
    updatedSizes[index][field] = field === 'quantity' ? parseInt(value, 10) || 0 : value;
    setFormData(prevState => ({
      ...prevState,
      availableSizes: updatedSizes
    }));
  };

  const handleAddSize = () => {
    setFormData(prevState => ({
      ...prevState,
      availableSizes: [...prevState.availableSizes, { size: '', quantity: 0 }]
    }));
  };

  const handleRemoveSize = (index) => {
    if (formData.availableSizes.length > 1) {
      setFormData(prevState => ({
        ...prevState,
        availableSizes: prevState.availableSizes.filter((_, i) => i !== index)
      }));
    }
  };

  const handleImageChange = (index, event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast.error('Image size should be less than 5MB.');
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          setCurrentImage(e.target.result);
          setCurrentImageIndex(index);
          setCropperVisible(true);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Please select a valid image file.');
      }
    }
  };

  const handleRemoveImage = (index) => {
    setFormData(prevState => ({
      ...prevState,
      images: prevState.images.map((img, i) => (i === index ? '' : img)),
    }));
  };

  const handleCroppedImage = async (croppedImageUrl) => {
    try {
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'cropped_image.jpg', { type: 'image/jpeg' });
      
      const imageUrl = await ProductService.uploadImage(file);
      setFormData((prevState) => ({
        ...prevState,
        images: prevState.images.map((img, i) => (i === currentImageIndex ? imageUrl : img)),
      }));
      setCropperVisible(false);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error('Failed to upload image. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category) {
      toast.error("Please select a category.");
      return;
    }

    if (!formData.images.some(Boolean)) {
      toast.error("Please upload at least one image.");
      return;
    }

    const productData = {
      ...formData,
      availableSizes: formData.availableSizes.filter(size => size.size && size.quantity > 0),
      images: formData.images.filter(Boolean),
      tags: typeof formData.tags === 'string' ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : formData.tags,
    };

    try {
      setLoading(true);
      await ProductService.updateProduct(id, productData);
      toast.success('Product updated successfully!');
      navigate('/admin/products');
    } catch (error) {
      toast.error(error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !currentProduct) {
    return <div>Loading...</div>;
  }

  if (!loading && !currentProduct) {
    return <div>Product not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Toaster position="top-right" richColors />
      <h2 className="text-2xl font-bold mb-4">Edit Product</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Product Name</label>
          <input
            type="text"
            name="productName"
            value={formData.productName}
            onChange={handleInputChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Category</label>
          <select
            name="category"
            value={formData.category || ""}
            onChange={handleInputChange}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">Select a category</option>
            {categories?.map(category => (
              <option key={category._id} value={category._id}>
                {category.name || category.CategoryName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1">Images (Select up to 4 images)</label>
          <div className="grid grid-cols-2 gap-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="bg-gray-100 p-4 rounded-lg flex flex-col items-center justify-center text-gray-600 hover:bg-gray-200 w-full h-40 relative overflow-hidden">
                  {image ? (
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center">
                      <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add Image</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(event) => handleImageChange(index, event)}
                />
                {image && (
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            className="w-full p-2 border rounded"
            rows="4"
          />
        </div>

        <div>
          <label className="block mb-1">Sale Price</label>
          <input
            type="number"
            name="regularPrice"
            value={formData.regularPrice}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Discount Percent</label>
          <input
            type="number"
            name="discountPercent"
            value={formData.discountPercent}
            onChange={handleInputChange}
            min="0"
            max="100"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Available Sizes</label>
          {formData.availableSizes.map((size, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={size.size}
                onChange={(e) => handleSizeChange(index, 'size', e.target.value)}
                placeholder="Size"
                className="w-1/2 p-2 border rounded"
              />
              <input
                type="number"
                value={size.quantity}
                onChange={(e) => handleSizeChange(index, 'quantity', e.target.value)}
                placeholder="Quantity"
                min="0"
                className="w-1/2 p-2 border rounded"
              />
              {formData.availableSizes.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => handleRemoveSize(index)} 
                  className="bg-red-500 text-white p-2 rounded"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button 
            type="button" 
            onClick={handleAddSize} 
            className="bg-blue-500 text-white p-2 rounded"
          >
            Add Size
          </button>
        </div>

        <div>
          <label className="block mb-1">Color</label>
          <input
            type="text"
            name="color"
            value={formData.color}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Tags (comma-separated)</label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* <div>
          <label className="block mb-1">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="outOfStock">Out of Stock</option>
          </select>
        </div> */}

        <button 
          type="submit" 
          className="bg-green-500 text-white p-2 rounded w-full"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Product'}
        </button>
      </form>

      {cropperVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <ImageCropper image={currentImage} onCrop={handleCroppedImage} aspect={1} />
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setCropperVisible(false)}
                className="bg-red-500 text-white p-2 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleCroppedImage(currentImage);
                  setCropperVisible(false);
                }}
                className="bg-green-500 text-white p-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



export default EditProduct;

