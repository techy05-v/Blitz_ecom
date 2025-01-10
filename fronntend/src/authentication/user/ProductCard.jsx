import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { wishlistAPI } from '../../api/wishlistServices/wishlistService';
import { toast } from 'sonner';

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
  onWishlistUpdate = () => {}
}) => {
  const [isWishlisted, setIsWishlisted] = useState(isInWishlist);
  const [isLoading, setIsLoading] = useState(false);

  // Check initial wishlist state when component mounts
  useEffect(() => {
    checkWishlistStatus();
  }, []);

  const checkWishlistStatus = async () => {
    try {
      const wishlistItems = await wishlistAPI.getWishlist();
      const isItemInWishlist = wishlistItems.some(item => item.product._id === id);
      setIsWishlisted(isItemInWishlist);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  const discountedPrice = price != null && discountPercent != null
    ? (price * (1 - (discountPercent || 0) / 100)).toFixed(2)
    : price?.toFixed(2) || '0.00';

  const imageUrl = images && images.length > 0 
    ? images[0] 
    : "/placeholder.svg?height=300&width=300";

  const formatPrice = (value) => {
    return value != null ? value.toFixed(2) : '0.00';
  };

  const totalStock = Array.isArray(availableSizes) 
    ? availableSizes.reduce((sum, size) => sum + (size.quantity || 0), 0)
    : 0;
    
  const isOutOfStock = totalStock === 0;

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;

    setIsLoading(true);
    try {
      // First check current wishlist status
      const wishlistItems = await wishlistAPI.getWishlist();
      const isItemInWishlist = wishlistItems.some(item => item.product._id === id);

      if (isItemInWishlist) {
        // If item is in wishlist, remove it
        await wishlistAPI.removeFromWishlist(id);
        setIsWishlisted(false);
        onWishlistUpdate(id, false);
        toast.success(`${name} has been removed from your wishlist`);
      } else {
        // If item is not in wishlist, add it
        await wishlistAPI.addToWishlist(id);
        setIsWishlisted(true);
        onWishlistUpdate(id, true);
        toast.success(`${name} has been added to your wishlist`);
      }
    } catch (error) {
      // Check if error is due to item already being in wishlist
      if (error.response?.data?.message?.includes('already in wishlist')) {
        setIsWishlisted(true); // Update local state to reflect actual status
        toast.error('This item is already in your wishlist');
      } else {
        toast.error('Failed to update wishlist. Please try again later.');
      }
      console.error('Wishlist update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="group relative bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="relative aspect-square">
        {/* Product Image */}
        <img
          src={imageUrl}
          alt={name || 'Product'}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Wishlist Button */}
        <button 
          type="button"
          onClick={handleWishlistClick}
          disabled={isLoading}
          className={`absolute top-2 right-2 p-2 bg-white rounded-full shadow-sm transition-all duration-300 z-10
            ${isWishlisted ? 'text-red-500' : 'text-gray-700'} 
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}
            opacity-100`}
          title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
          <span className="sr-only">
            {isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          </span>
        </button>

        {/* New Tag */}
        {isNew && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            New
          </div>
        )}
        
        {/* Stock Status */}
        <div className={`absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-semibold ${
          isOutOfStock 
            ? 'bg-red-500 text-white' 
            : 'bg-green-500 text-white'
        }`}>
          {isOutOfStock ? 'Out of Stock' : 'In Stock'}
        </div>
      </div>
      
      {/* Product Details */}
      <div className="p-4">
        <Link to={`/user/product/${id}`} className="block">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors duration-300">
            {name || 'Product Name'}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-4 w-4 ${
                    i < Math.floor(rating) 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300'
                  }`} 
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">
              ({reviewCount} reviews)
            </span>
          </div>
          
          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-gray-900">
                ₹{discountedPrice}
              </span>
              {discountPercent > 0 && price != null && (
                <span className="ml-2 text-sm text-gray-500 line-through">
                  ₹{formatPrice(price)}
                </span>
              )}
            </div>
            {discountPercent > 0 && (
              <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                {discountPercent}% OFF
              </span>
            )}
          </div>
        </Link>
      </div>
      
      {/* View Product Button */}
      <div className="p-4 pt-0">
        <Link 
          to={`/user/product/${id}`}
          className={`block w-full text-center rounded-md py-2 px-3 text-sm font-medium 
            shadow-md transition duration-300 focus:outline-none focus:ring-2 
            focus:ring-offset-2 ${
              isOutOfStock 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-400 hover:bg-green-500 text-white focus:ring-black'
            }`}
        >
          {isOutOfStock ? 'Out of Stock' : 'View Product'}
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;