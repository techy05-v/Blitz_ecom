import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import cartService from "../../api/cartService/cartService";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const response = await cartService.getCartItems();
      setCartItems(response.cart.items);
    } catch (err) {
      toast.error('Failed to fetch cart items. Please try again later.');
    } finally {
      setLoading(false);
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
      setCartItems(cartItems);
      toast.error(err.message || 'Could not update item quantity. Please try again.');
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
      setCartItems(cartItems);
      toast.error('Could not clear cart. Please try again.');
    }
  };

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((acc, item) => 
      acc + (item.discountedPrice * item.quantity), 0);
    const tax = subtotal * 0.1;
    const shipping = subtotal > 0 ? 15.99 : 0;
    return {
      subtotal,
      tax,
      shipping,
      total: subtotal + tax + shipping
    };
  };

  if (loading && cartItems.length === 0) return <div className="text-center py-8">Loading...</div>;

  const { subtotal, tax, shipping, total } = calculateTotals();

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
                        src={item.product.images[0]}
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
                        <p className="mt-1 text-sm font-semibold text-purple-600">₹{item.discountedPrice}</p>
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
                            aria-label="Decrease quantity"
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
                            aria-label="Increase quantity"
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
                          aria-label="Remove item"
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
              <dl className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="text-base text-gray-600">Subtotal</dt>
                  <dd className="text-base font-medium text-gray-900">₹{subtotal.toFixed(2)}</dd>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <dt className="text-base text-gray-600">Shipping estimate</dt>
                  <dd className="text-base font-medium text-gray-900">₹{shipping.toFixed(2)}</dd>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <dt className="text-base text-gray-600">Tax estimate</dt>
                  <dd className="text-base font-medium text-gray-900">₹{tax.toFixed(2)}</dd>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <dt className="text-lg font-bold text-gray-900">Order total</dt>
                  <dd className="text-lg font-bold text-purple-600">₹{total.toFixed(2)}</dd>
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

