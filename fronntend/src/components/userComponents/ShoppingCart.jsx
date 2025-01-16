import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Tag } from 'lucide-react';
import cartService from "../../api/cartService/cartService";
import offerService from "../../api/offer/offerApi";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState({});

  useEffect(() => {
    fetchCartItems();
  }, []);

  useEffect(() => {
    if (cartItems.length > 0) {
      fetchOffersForItems();
    } else {
      setOffers({});
    }
  }, [cartItems]);
  useEffect(() => {
    console.log('Current Cart Items:', cartItems);
  }, [cartItems]);

  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const response = await cartService.getCartItems();
      console.log('Cart Response:', response); // Debug log
      setCartItems(response?.cart?.items || []);
    } catch (err) {
      console.error('Cart fetch error:', err); // Debug log
      toast.error('Failed to fetch cart items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOffersForItems = async () => {
    try {
      const offersMap = {};
      await Promise.all(
        cartItems.map(async (item) => {
          if (!item.product?._id) {
            console.error('Invalid product ID in cart item:', item);
            return;
          }
          
          try {
            const response = await offerService.getProductOffers(item.product._id);
            console.log(`Offers response for product ${item.product._id}:`, response);
            
            if (response?.success && Array.isArray(response.offers)) {
              const activeOffers = response.offers.filter(offer => 
                offer.isActive && 
                new Date(offer.startDate) <= new Date() && 
                new Date(offer.endDate) >= new Date()
              );
              
              if (activeOffers.length > 0) {
                const bestOffer = activeOffers.reduce((prev, current) => 
                  (prev.discountPercent > current.discountPercent) ? prev : current
                );
                offersMap[item.product._id] = bestOffer;
              }
            }
          } catch (error) {
            console.error(`Failed to fetch offers for product ${item.product._id}:`, error);
          }
        })
      );
      
      console.log('Final Offers Map:', offersMap);
      setOffers(offersMap);
    } catch (error) {
      console.error('Offers fetch error:', error);
      toast.error('Failed to fetch offers');
    }
  };

  const handleQuantityChange = async (productId, size, newQuantity, productName, availableQuantity) => {
    if (newQuantity < 1) {
      toast.warning('Quantity cannot be less than 1');
      return;
    }
    if (newQuantity > 5) {
      toast.warning('Maximum quantity allowed is 5 items per product');
      return;
    }
    if (newQuantity > availableQuantity) {
      toast.warning(`Only ${availableQuantity} items available in stock for selected size`);
      return;
    }

    const updatedItems = cartItems.map(item => {
      if (item.product._id === productId && item.size === size) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    setCartItems(updatedItems);

    try {
      const response = await cartService.updateCartItem({
        productId,
        quantity: newQuantity,
        size
      });
      
      if (response.success) {
        toast.success(`Updated ${productName} quantity to ${newQuantity}`);
      } else {
        setCartItems(cartItems);
        toast.error(response.message || 'Could not update item quantity');
      }
    } catch (err) {
      console.error('Update quantity error:', err); // Debug log
      setCartItems(cartItems);
      toast.error('Could not update item quantity. Please try again.');
    }
  };

  const handleRemoveItem = async (productId, size, productName) => {
    const updatedItems = cartItems.filter(
      item => !(item.product._id === productId && item.size === size)
    );
    setCartItems(updatedItems);

    try {
      await cartService.removeFromCart({ productId, size });
      toast.success(`${productName} has been removed from your cart`);
    } catch (err) {
      console.error('Remove item error:', err); // Debug log
      setCartItems(cartItems);
      toast.error('Could not remove item from cart. Please try again.');
    }
  };

  const handleClearCart = async () => {
    if (cartItems.length === 0) {
      toast.warning('Your cart is already empty');
      return;
    }

    setCartItems([]);

    try {
      await cartService.clearCart();
      toast.success('Successfully removed all items from your cart');
    } catch (err) {
      console.error('Clear cart error:', err); // Debug log
      setCartItems(cartItems);
      toast.error('Could not clear cart. Please try again.');
    }
  };
  const calculateItemPrice = (item) => {
    if (!item?.product) {
      console.error('Invalid item data:', item);
      return {
        originalPrice: 0,
        finalPrice: 0,
        discountPercent: 0,
        hasDiscount: false
      };
    }
  
    try {
      // Get regular and sale prices
      const regularPrice = Number(item.price || item.product.regularPrice) || 0;
      const salePrice = Number(item.discountedPrice || item.product.salePrice) || regularPrice;
      
      // Get product's discount percent
      const productDiscount = item.product.discountPercent || 0;
      
      // Get best offer discount if any
      const productOffers = item.product.offers || [];
      const bestOffer = productOffers.reduce((best, current) => {
        return (current.discountPercent > (best?.discountPercent || 0)) ? current : best;
      }, null);
  
      console.log('Price calculation inputs:', {
        regularPrice,
        salePrice,
        productDiscount,
        bestOffer
      });
  
      // Calculate final price using the best discount available
      let finalPrice = regularPrice;
      let bestDiscountPercent = 0;
  
      // Check sale price
      if (salePrice < finalPrice) {
        finalPrice = salePrice;
        bestDiscountPercent = ((regularPrice - salePrice) / regularPrice) * 100;
      }
  
      // Check product's built-in discount
      if (productDiscount > 0) {
        const discountPrice = regularPrice * (1 - productDiscount / 100);
        if (discountPrice < finalPrice) {
          finalPrice = discountPrice;
          bestDiscountPercent = productDiscount;
        }
      }
  
      // Check offer discount
      if (bestOffer) {
        const offerPrice = regularPrice * (1 - bestOffer.discountPercent / 100);
        if (offerPrice < finalPrice) {
          finalPrice = offerPrice;
          bestDiscountPercent = bestOffer.discountPercent;
        }
      }
  
      const result = {
        originalPrice: regularPrice,
        finalPrice: Number(finalPrice.toFixed(2)),
        discountPercent: Number(bestDiscountPercent.toFixed(1)),
        hasDiscount: finalPrice < regularPrice
      };
  
      console.log('Price calculation result:', result);
      return result;
    } catch (error) {
      console.error('Price calculation error:', error, 'Item:', item);
      return {
        originalPrice: 0,
        finalPrice: 0,
        discountPercent: 0,
        hasDiscount: false
      };
    }
  };

  const calculateSubtotal = (item) => {
    try {
      if (!item?.quantity || item.quantity < 0) {
        console.error('Invalid quantity:', item);
        return 0;
      }
      const { finalPrice } = calculateItemPrice(item);
      return Number((finalPrice * item.quantity).toFixed(2));
    } catch (error) {
      console.error('Subtotal calculation error:', error);
      return 0;
    }
  };
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + calculateSubtotal(item), 0).toFixed(2);
  };

  const renderPriceSection = (item) => {
    try {
      console.log('Rendering price for item:', item);
      const priceInfo = calculateItemPrice(item);
      console.log('Price info:', priceInfo);

      return (
        <div className="mt-1 flex flex-col">
          <div className="flex items-center">
            <p className={`text-sm font-semibold ${priceInfo.hasDiscount ? 'line-through text-gray-500' : 'text-purple-600'}`}>
              ₹{priceInfo.originalPrice}
            </p>
            {priceInfo.hasDiscount && (
              <>
                <p className="ml-2 text-sm font-semibold text-purple-600">
                  ₹{priceInfo.finalPrice}
                </p>
                <div className="ml-2 inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                  <Tag size={12} className="mr-1" />
                  {priceInfo.discountPercent}% OFF
                </div>
              </>
            )}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            Subtotal: ₹{(priceInfo.finalPrice * (item.quantity || 1)).toFixed(2)}
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering price section:', error);
      return (
        <div className="mt-1 text-sm text-gray-500">
          Price information unavailable
        </div>
      );
    }
  };
  if (loading && cartItems.length === 0) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-purple-900 mb-10 flex items-center justify-center sm:justify-start">
          <ShoppingCart className="mr-4 text-pink-600" size={36} />
          Your Shopping Cart
        </h1>
        
        {cartItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-lg p-8">
            <p className="text-xl text-gray-600 mb-6">Your cart is empty</p>
            <button
              onClick={() => navigate('/user/shop')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors duration-300"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="mt-12 lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start xl:gap-x-16">
            <section aria-labelledby="cart-heading" className="lg:col-span-7">
              <ul role="list" className="bg-white rounded-lg shadow-lg overflow-hidden">
                {cartItems.map((item, index) => (
                  <li key={`${item.product._id}-${item.size}`} className={`flex p-6 ${index !== 0 ? 'border-t border-gray-200' : ''}`}>
                    <div className="flex-shrink-0">
                      <img
                        src={item.product.images[0] || '/placeholder.png'}
                        alt={item.product.productName}
                        className="w-24 h-24 rounded-lg object-cover object-center sm:w-32 sm:h-32"
                      />
                    </div>

                    <div className="ml-4 flex-1 flex flex-col sm:ml-6">
                      <div>
                        <div className="flex justify-between">
                          <h3 className="text-lg font-medium text-gray-900">
                            {item.product.productName}
                          </h3>
                          <p className="ml-4 text-sm text-gray-500">Size: {item.size}</p>
                        </div>
                        {renderPriceSection(item)}
                      </div>

                      <div className="mt-4 flex-1 flex items-end justify-between">
                        <div className="flex items-center border border-gray-300 rounded-full">
                          <button 
                            onClick={() => handleQuantityChange(
                              item.product._id, 
                              item.size, 
                              item.quantity - 1,
                              item.product.productName,
                              item.availableQuantity
                            )}
                            className="p-2 hover:bg-gray-100 rounded-l-full transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="mx-4 font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => handleQuantityChange(
                              item.product._id, 
                              item.size, 
                              item.quantity + 1,
                              item.product.productName,
                              item.availableQuantity
                            )}
                            className="p-2 hover:bg-gray-100 rounded-r-full transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <button 
                          onClick={() => handleRemoveItem(
                            item.product._id, 
                            item.size,
                            item.product.productName
                          )}
                          className="text-pink-500 hover:text-pink-700 transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-16 bg-white rounded-lg px-4 py-6 sm:p-6 lg:p-8 lg:mt-0 lg:col-span-5 shadow-lg">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Order Summary</h2>
              <dl className="space-y-4">
                {cartItems.map(item => (
                  <div key={`${item.product._id}-${item.size}-summary`} className="flex justify-between text-sm">
                    <dt>{item.product.productName} (x{item.quantity})</dt>
                    <dd className="font-medium">₹{calculateSubtotal(item)}</dd>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <dt className="text-lg font-bold text-gray-900">Total Amount</dt>
                  <dd className="text-lg font-bold text-purple-600">₹{calculateTotal()}</dd>
                </div>
              </dl>

              <div className="mt-8 space-y-4">
                <button
                  onClick={() => navigate('/user/checkout')}
                  className="w-full bg-purple-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-lg font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-purple-500 transition-colors duration-300 flex items-center justify-center"
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-2" size={20} />
                </button>

                <button
                  onClick={handleClearCart}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 text-lg font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-gray-500 transition-colors duration-300"
                >
                  Clear Cart
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;