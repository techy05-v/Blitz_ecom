"use client"

import { useState, useEffect } from "react"
import { Heart, Star } from "lucide-react"
import Modal from "../../confirmationModal/Modal"
import Cookies from 'js-cookie'
import { useNavigate } from "react-router-dom"
import { wishlistAPI } from '../../api/wishlistServices/wishlistService'
import { toast } from 'sonner'

const ProductCard = ({
  id,
  name,
  price,
  images,
  discountPercent = 0,
  rating = 0,
  reviewCount = 0,
  isNew = false,
  availableSizes = [],
  isInWishlist = false,
  onWishlistUpdate = () => {},
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
  const [userAccessToken, setUserAccessToken] = useState(null);
  const [localIsInWishlist, setLocalIsInWishlist] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  // Fetch initial wishlist state when component mounts
  useEffect(() => {
    const token = Cookies.get("user_access_token");
    setUserAccessToken(token);
    
    if (token) {
      checkWishlistStatus();
    }
  }, [id]);

  // Update local state when isInWishlist prop changes
  useEffect(() => {
    setLocalIsInWishlist(isInWishlist);
  }, [isInWishlist]);

  const checkWishlistStatus = async () => {
    try {
      const wishlistItems = await wishlistAPI.getWishlist();
      const isItemInWishlist = wishlistItems.some(item => 
        item._id === id || item.product?._id === id
      );
      setLocalIsInWishlist(isItemInWishlist);
    } catch (error) {
      console.error("Error checking wishlist status:", error);
    }
  };

  const isAuthenticated = () => {
    return !!userAccessToken;
  };

  const handleProductClick = (e) => {
    e.preventDefault();
    // Remove authentication check and directly navigate to product page
    navigate(`/user/product/${id}`);
  };

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated()) {
      setModalType("wishlist");
      setIsModalOpen(true);
      return;
    }

    if (isUpdating) return; // Prevent multiple clicks while updating

    try {
      setIsUpdating(true);
      
      if (localIsInWishlist) {
        const loadingToast = toast.loading("Removing from wishlist...");
        
        await wishlistAPI.removeFromWishlist(id);
        setLocalIsInWishlist(false);
        onWishlistUpdate(id, false);
        
        toast.dismiss(loadingToast);
        toast.success(`${name || 'Product'} removed from wishlist`);
      } else {
        const loadingToast = toast.loading("Adding to wishlist...");
        
        await wishlistAPI.addToWishlist(id);
        setLocalIsInWishlist(true);
        onWishlistUpdate(id, true);
        
        toast.dismiss(loadingToast);
        toast.success(`${name || 'Product'} added to wishlist`);
      }
    } catch (error) {
      console.error("Wishlist operation failed:", error);
      toast.error(
        error.response?.data?.message || 
        error.message || 
        "Failed to update wishlist. Please try again."
      );
      setLocalIsInWishlist(!localIsInWishlist);
    } finally {
      setIsUpdating(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const navigateToLogin = () => {
    navigate("/login");
    closeModal();
  };

  const discountedPrice =
    price != null && discountPercent != null
      ? (price * (1 - (discountPercent || 0) / 100)).toFixed(2)
      : price?.toFixed(2) || "0.00";

  const imageUrl =
    images && images.length > 0 ? images[0] : "/placeholder.svg?height=300&width=300";

  const totalStock = Array.isArray(availableSizes)
    ? availableSizes.reduce((sum, size) => sum + (size.quantity || 0), 0)
    : 0;

  const isOutOfStock = totalStock === 0;

  return (
    <div className="group relative bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
      {/* Product Image Section */}
      <div className="relative aspect-square">
        <div onClick={handleProductClick} className="cursor-pointer">
          <img
            src={imageUrl}
            alt={name || "Product"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          disabled={isUpdating}
          className={`absolute top-2 right-2 p-2 bg-white rounded-full shadow-sm transition-all duration-300 z-10
            ${localIsInWishlist ? "text-red-500" : "text-gray-700"} 
            ${isUpdating ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100 opacity-100"}`}
          title={localIsInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`h-5 w-5 ${localIsInWishlist ? "fill-current" : ""}`} />
          <span className="sr-only">
            {localIsInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          </span>
        </button>

        {/* New Product Badge */}
        {isNew && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            New
          </div>
        )}

        {/* Stock Status Badge */}
        <div
          className={`absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-semibold ${
            isOutOfStock ? "bg-red-500 text-white" : "bg-green-500 text-white"
          }`}
        >
          {isOutOfStock ? "Out of Stock" : "In Stock"}
        </div>
      </div>

      {/* Product Details Section */}
      <div className="p-4">
        <div onClick={handleProductClick} className="block cursor-pointer">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors duration-300">
            {name || "Product Name"}
          </h3>

          {/* Rating Section */}
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">({reviewCount} reviews)</span>
          </div>

          {/* Price Section */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-gray-900">₹{discountedPrice}</span>
              {discountPercent > 0 && price != null && (
                <span className="ml-2 text-sm text-gray-500 line-through">₹{price.toFixed(2)}</span>
              )}
            </div>
            {discountPercent > 0 && (
              <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                {discountPercent}% OFF
              </span>
            )}
          </div>
        </div>
      </div>

      {/* View Product Button */}
      <div className="p-4 pt-0">
        <button
          onClick={handleProductClick}
          className={`block w-full text-center rounded-md py-2 px-3 text-sm font-medium 
            shadow-md transition duration-300 focus:outline-none focus:ring-2 
            focus:ring-offset-2 ${
              isOutOfStock
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-400 hover:bg-green-500 text-white focus:ring-black"
            }`}
        >
          {isOutOfStock ? "Out of Stock" : "View Product"}
        </button>
      </div>

      {/* Modal - Only shown for unauthenticated users trying to use wishlist */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <h2 className="text-2xl font-bold mb-4">Add to Wishlist</h2>
        <p className="mb-6">Please log in to add items to your wishlist.</p>
        <div className="flex justify-between">
          <button
            onClick={navigateToLogin}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Log In
          </button>
          <button
            onClick={closeModal}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ProductCard;