import React, { useState, useEffect } from 'react';
import { TrashIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { wishlistAPI } from '../../api/wishlistServices/wishlistService';
import cartService from '../../api/cartService/cartService';
import { toast } from 'sonner';
import SizeModal from '../../confirmationModal/sizeModal';

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    fetchWishlistItems();
  }, []);

  const fetchWishlistItems = async () => {
    try {
      setIsLoading(true);
      const data = await wishlistAPI.getWishlist();
      
      // Debug log to see the complete data structure
      console.log('Raw wishlist data:', JSON.stringify(data, null, 2));
      
      const validatedData = data.map(item => {
        // Debug log for each item
        console.log('Individual product:', JSON.stringify(item.product, null, 2));
        
        return {
          product: {
            ...item.product,
            regularPrice: item.product.regularPrice || 0, // Keep it simple, just use the regularPrice field
            discountPercent: Number(item.product?.discountPercent) || 0,
            images: item.product?.images || [],
            availableSizes: item.product?.availableSizes || []
          }
        };
      });
      
      setWishlistItems(validatedData);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error("Failed to fetch wishlist items. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const checkProductInCart = async (productId, size) => {
    try {
      const response = await cartService.getCartItems();

      if (!response.cart) {
        return false;
      }

      const cartItems = response.cart.items || [];

      const exists = cartItems.some(item => {
        const itemProductId = item.product?._id || item.product;
        return itemProductId === productId && item.size === size;
      });

      return exists;
    } catch (error) {
      console.error("Error checking cart:", error);
      return false;
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await wishlistAPI.removeFromWishlist(productId);
      setWishlistItems(items => items.filter(item => item.product._id !== productId));
      toast.success("Item removed from wishlist");
    } catch (err) {
      toast.error("Failed to remove item from wishlist");
    }
  };

  const addToCart = async (size) => {
    if (!selectedProduct || isAddingToCart) return;

    setIsAddingToCart(true);
    try {
      const isInCart = await checkProductInCart(selectedProduct._id, size.size);

      if (isInCart) {
        toast.error(`${selectedProduct.productName} (size: ${size.size}) is already in your cart`);
        setIsSizeModalOpen(false);
        setSelectedProduct(null);
        return;
      }

      await cartService.addToCart({
        productId: selectedProduct._id,
        size: size.size,
        quantity: 1
      });

      await removeFromWishlist(selectedProduct._id);
      toast.success(`Added ${selectedProduct.productName} (Size: ${size.size}) to cart`);
      setIsSizeModalOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      toast.error('Failed to add item to cart. Please try again.');
      console.error('Add to cart error:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const openSizeModal = (product) => {
    setSelectedProduct(product);
    setIsSizeModalOpen(true);
  };

  const closeSizeModal = () => {
    setIsSizeModalOpen(false);
    setSelectedProduct(null);
    setIsAddingToCart(false);
  };

  const calculateDiscountedPrice = (regularPrice, discountPercent) => {
    const discountAmount = (regularPrice * discountPercent) / 100;
    return (regularPrice - discountAmount).toFixed(2);
  };

  const isProductInStock = (product) => {
    return product.availableSizes.some(size => size.quantity > 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">Loading wishlist...</div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">My Wishlist</h1>
        {wishlistItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">Your wishlist is empty.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Product</th>
                    <th className="text-left py-2">Price</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wishlistItems.map(({ product }) => (
                    <tr key={product._id} className="border-b">
                      <td className="py-4">
                        <div className="flex items-center">
                          <img
                            src={product.images[0]}
                            alt={product.productName}
                            className="w-20 h-20 object-cover mr-4 rounded"
                          />
                          <div>
                            <h3 className="font-semibold text-gray-800">{product.productName}</h3>
                            <div className="text-sm text-gray-600 mt-1">
                              Available Sizes: {product.availableSizes
                                .filter(size => size.quantity > 0)
                                .map(size => size.size)
                                .join(', ')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">
                            ₹{calculateDiscountedPrice(product.regularPrice, product.discountPercent)}
                          </span>
                          {product.discountPercent > 0 && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹{Number(product.regularPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        {isProductInStock(product) ? (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            In Stock
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            Out of Stock
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="flex space-x-2">
                          <button
                            className={`flex items-center ${isProductInStock(product)
                              ? 'text-blue-600 hover:text-blue-800'
                              : 'text-gray-400 cursor-not-allowed'
                              }`}
                            onClick={() => isProductInStock(product) && openSizeModal(product)}
                            disabled={!isProductInStock(product)}
                          >
                            <ShoppingCartIcon className="w-5 h-5 mr-1" />
                            Add to Cart
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 flex items-center"
                            onClick={() => removeFromWishlist(product._id)}
                          >
                            <TrashIcon className="w-5 h-5 mr-1" />
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <SizeModal
        isOpen={isSizeModalOpen}
        onClose={closeSizeModal}
        product={selectedProduct}
        onSelectSize={addToCart}
        isLoading={isAddingToCart}
      />
    </>
  );
};

export default Wishlist;