import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addressService } from "../../api/addressService/addressService";
import cartService from "../../api/cartService/cartService";
import orderService from "../../api/orderService/orderService";
import { toast } from "sonner";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    tax: 0,
    shipping: 5.0,
    total: 0,
  });

  const paymentMethods = [
    { id: "card", name: "Credit/Debit Card", icon: "💳" },
    { id: "cash_on_delivery", name: "Cash on Delivery", icon: "💵" },
    { id: "upi", name: "UPI", icon: "📱" },
  ];

  useEffect(() => {
    let isMounted = true;

    const loadCheckoutData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch addresses
        console.log("Fetching addresses...");
        const addressResponse = await addressService.getAllAddress();
        console.log("Address response:", addressResponse);

        // Handle the array response directly
        const addressArray = Array.isArray(addressResponse)
          ? addressResponse
          : [];

        // Fetch cart items
        console.log("Fetching cart items...");
        const cartResponse = await cartService.getCartItems();
        console.log("Cart response:", cartResponse);

        // Validate cart response
        if (!cartResponse || !cartResponse.success || !cartResponse.cart) {
          throw new Error("Invalid cart response format");
        }

        // Extract cart items - adjust this path based on your actual response structure
        const cartItemsArray = cartResponse.cart.items || [];

        if (isMounted) {
          setAddresses(addressArray);
          setCartItems(cartItemsArray);

          // Set default selected address if available
          if (addressArray.length > 0) {
            setSelectedAddress(addressArray[0]);
          }

          calculateOrderSummary(cartItemsArray);
        }
      } catch (error) {
        console.error("Error loading checkout data:", error);
        setError(error.message);
        toast.error(`Error: ${error.message}`);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCheckoutData();

    return () => {
      isMounted = false;
    };
  }, []);

  const calculateOrderSummary = (items) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.warn("No items to calculate summary");
      return;
    }

    const subtotal = items.reduce((sum, item) => {
      if (!item.product || !item.quantity || !item.discountedPrice) {
        console.warn("Invalid item data:", item);
        return sum;
      }
      return sum + item.discountedPrice * item.quantity;
    }, 0);

    const tax = subtotal * 0.08;
    const shipping = 5.0;
    const total = subtotal + tax + shipping;

    setOrderSummary({
      subtotal,
      tax,
      shipping,
      total,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        shippingAddressId: selectedAddress._id,
        paymentMethod: selectedPaymentMethod.id,
        orderNotes: "",
        items: cartItems.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          size: item.size,
          price: item.price,
          discountedPrice: item.discountedPrice,
        })),
        totalAmount: orderSummary.total,
      };

      const response = await orderService.createOrder(orderData);

      // Check if response exists and has the expected order data
      if (response && response.order && response.order._id) {
        await cartService.clearCart();
        toast.success("Order placed successfully!");
        
        // First ensure the toast is shown
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Then navigate to the success page
        navigate("/user/success", { 
          state: { 
            orderId: response.order._id,
            orderDetails: response.order 
          },
          replace: true // This prevents going back to checkout page
        });
      } else {
        throw new Error(response.message || "Invalid order response");
      }
    } catch (error) {
      console.error("Order creation failed:", error);
      // Handle specific error cases
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || "Invalid order data");
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else {
        toast.error("Failed to place order. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-md rounded-lg p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">Loading checkout information...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-md rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">
                Error Loading Checkout
              </h2>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-md rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No Delivery Addresses Found
              </h2>
              <p className="text-gray-600 mb-4">
                Please add a delivery address to continue checkout.
              </p>
              <button
                onClick={() => navigate("/address/add")}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Add New Address
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-md rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Your Cart is Empty
              </h2>
              <p className="text-gray-600 mb-4">
                Add items to your cart to proceed with checkout.
              </p>
              <button
                onClick={() => navigate("/user/shop")}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2">
              {/* Delivery Address Section */}
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                  Delivery Address
                </h2>
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address._id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        selectedAddress?._id === address._id
                          ? "border-blue-500 bg-blue-50"
                          : "hover:border-gray-400"
                      }`}
                      onClick={() => setSelectedAddress(address)}
                    >
                      <p className="font-semibold text-gray-800">
                        {address.full_name}
                      </p>
                      <p className="text-sm text-gray-600">{address.street}</p>
                      <p className="text-sm text-gray-600">
                        {address.city}, {address.state} {address.pincode}
                      </p>
                      <p className="text-sm text-gray-600">
                        Phone: {address.phone_number}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Payment Method Section */}
              <section>
                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                  Payment Method
                </h2>
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        selectedPaymentMethod?.id === method.id
                          ? "border-blue-500 bg-blue-50"
                          : "hover:border-gray-400"
                      }`}
                      onClick={() => setSelectedPaymentMethod(method)}
                    >
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{method.icon}</span>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {method.name}
                          </p>
                          {method.id === "cash_on_delivery" && (
                            <p className="text-sm text-gray-600">
                              Pay when your order arrives
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Order Summary Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Order Summary
              </h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.product._id} className="flex justify-between">
                    <span className="text-gray-800">
                      {item.product.name} ({item.size}) x {item.quantity}
                    </span>
                    <span className="text-gray-800">
                      ${(item.discountedPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-800">
                      ${orderSummary.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (8%)</span>
                    <span className="text-gray-800">
                      ${orderSummary.tax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-800">
                      ${orderSummary.shipping.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg mt-4">
                    <span>Total</span>
                    <span>${orderSummary.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={
                    !selectedAddress || !selectedPaymentMethod || loading
                  }
                  className={`w-full py-3 rounded-lg transition-colors focus:outline-none ${
                    !selectedAddress || !selectedPaymentMethod || loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  {loading ? "Processing..." : "Place Order"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
