import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';

const ProductCard = ({ id, name, price, images, discountPercent, rating = 0, reviewCount = 0, isNew = false }) => {
  const discountedPrice = price != null && discountPercent != null
    ? price * (1 - discountPercent / 100)
    : price;

  const imageUrl = images && images.length > 0 
    ? images[0] 
    : "/placeholder.svg?height=300&width=300";

  const formatPrice = (value) => {
    return value != null ? value.toFixed(2) : 'N/A';
  };

  return (
    <div className="group relative bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="relative aspect-square">
        <img
          src={imageUrl}
          alt={name || 'Product'}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <button 
          className="absolute top-2 right-2 p-2 bg-white rounded-full text-gray-700 shadow-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100 hover:bg-gray-100"
          title="Add to wishlist"
        >
          <Heart className="h-5 w-5" />
          <span className="sr-only">Add to wishlist</span>
        </button>
        {isNew && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            New
          </div>
        )}
      </div>
      
      <div className="p-4">
        <Link to={`/user/product/${id}`} className="block">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors duration-300">
            {name || 'Product Name'}
          </h3>
          
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">({reviewCount} reviews)</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-gray-900">
                ₹{formatPrice(discountedPrice)}
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
      
      <div className="p-4 pt-0">
        <Link 
          to={`/user/product/${id}`}
          className="block w-full text-center rounded-md bg-blue-600 py-2 px-3 text-sm font-medium text-white shadow-md transition duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          View Product
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;

