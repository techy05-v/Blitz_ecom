import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addressService } from "../../api/addressService/addressService";
import cartService from "../../api/cartService/cartService";
import orderService from "../../api/orderService/orderService";
import couponService from "../../api/couponService/couponService";
import { toast } from "sonner";
import { CreditCard, Wallet, DollarSign, Plus, Tag, MapPin, CreditCardIcon, Truck } from 'lucide-react';
import AddressFormModal from "../../confirmationModal/AddressModal";
import { jwtDecode } from "jwt-decode";
import Cookies from 'js-cookie';
import OrderFailurePage from "../../components/userComponents/OrderFailurePage";
const CheckoutPage = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    tax: 0,
    shipping: 5.0,
    discount: 0,
    total: 0,
  });
  const [coupons, setCoupons] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");

  const paymentMethods = [
    { id: "razorpay", name: "Razor Pay", icon: CreditCard },
    { id: "wallet", name: "Wallet Pay", icon: Wallet },
    { id: "cash_on_delivery", name: "Cash on Delivery", icon: DollarSign },
  ];

  useEffect(() => {
    let isMounted = true;

    const loadCheckoutData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [addressResponse, cartResponse, couponsResponse] = await Promise.all([
          addressService.getAllAddress(),
          cartService.getCartItems(),
          couponService.listCoupons()
        ]);

        if (!cartResponse || !cartResponse.success || !cartResponse.cart) {
          throw new Error("Invalid cart response format");
        }

        const cartItemsArray = cartResponse.cart.items || [];

        if (isMounted) {
          setAddresses(Array.isArray(addressResponse) ? addressResponse : []);
          setCartItems(cartItemsArray);

          if (couponsResponse && couponsResponse.success && Array.isArray(couponsResponse.coupons)) {
            setCoupons(couponsResponse.coupons);
          } else {
            console.warn('Invalid coupons response:', couponsResponse);
            setCoupons([]);
          }

          if (addressResponse.length > 0) {
            setSelectedAddress(addressResponse[0]);
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

  const getUserIdFromToken = () => {
    try {
      const token = Cookies.get('user_access_token');
      console.log("token",token)
      if (!token) {
        console.log("No token found");
        return null;
      }

      const decoded = jwtDecode(token);
      console.log("Decoded token:", decoded);
      return decoded.data._id;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const calculateOrderSummary = (items) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.warn("No items to calculate summary");
      return;
    }

    const subtotal = items.reduce((sum, item) => {
      if (!item.product || !item.quantity || typeof item.discountedPrice !== 'number') {
        console.warn("Invalid item data:", item);
        return sum;
      }
      return sum + (item.discountedPrice * item.quantity);
    }, 0);

    const tax = subtotal * 0.08;
    const shipping = 5.0;

    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percentage') {
        discount = subtotal * (parseFloat(appliedCoupon.discountValue) / 100);
      } else if (appliedCoupon.discountType === 'fixed') {
        discount = parseFloat(appliedCoupon.discountValue);
      }
    }

    const total = subtotal + tax + shipping - discount;

    setOrderSummary({
      subtotal,
      tax,
      shipping,
      discount,
      total
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
        tax: orderSummary.tax,           // Add this
        shipping: orderSummary.shipping, // Add this
        appliedCouponId: appliedCoupon ? appliedCoupon.couponId : null
    };
  
        if (selectedPaymentMethod.id === 'razorpay') {
            const paymentInitiated = await handleRazorpayPayment(orderData);
            if (!paymentInitiated) {
                setLoading(false);
                return;
            }
        } else if (selectedPaymentMethod.id === 'wallet') {
            // Handle wallet payment
            const response = await orderService.createOrder(orderData);
            
            if (!response || !response.success) {
                throw new Error(response?.message || 'Failed to process wallet payment');
            }

            if (response.success) {
                toast.success("Payment successful using wallet balance!");
                navigate("/user/success", {
                    state: {
                        orderId: response.data.orderId,
                        orderDetails: response.data
                    },
                    replace: true
                });
            }
        } else {
            // Handle cash on delivery
            const response = await orderService.createOrder(orderData);
            
            if (!response || !response.success) {
                throw new Error(response?.message || 'Failed to create order');
            }
  
            toast.success("Order placed successfully!");
            navigate("/user/success", {
                state: {
                    orderId: response.data.orderId,
                    orderDetails: response.data
                },
                replace: true
            });
        }
    } catch (error) {
        console.error("Order creation failed:", error);
        toast.error(error.message || "Failed to place order. Please try again.");
    } finally {
        setLoading(false);
    }
};

  const handleAddressAdded = async () => {
    try {
      const updatedAddresses = await addressService.getAllAddress();
      setAddresses(Array.isArray(updatedAddresses) ? updatedAddresses : []);
      if (updatedAddresses.length > 0 && !selectedAddress) {
        setSelectedAddress(updatedAddresses[0]);
      }
    } catch (error) {
      console.error("Error fetching updated addresses:", error);
      toast.error("Failed to update address list");
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
  
    try {
      const userId = getUserIdFromToken();
      console.log("userId",userId)
      if (!userId) {
        toast.error("Authentication required to apply coupon");
        return;
      }
  
      const cartTotal = cartItems.reduce((sum, item) => {
        return sum + (item.discountedPrice * item.quantity);
      }, 0);
  
      const couponRequest = {
        code: couponCode.trim(),
        cartTotal: parseFloat(cartTotal.toFixed(2)),
        userId: userId,
        appliedCouponId: appliedCoupon ? appliedCoupon.couponId : null
      };
  
      const response = await couponService.applyCoupon(couponRequest);
      
      if (response && response.success) {
        setAppliedCoupon({
          couponId: response.couponId,
          code: response.couponCode,
          discountType: 'percentage',
          discountValue: response.offerPercentage
        });
  
        // Calculate new totals
        const subtotal = parseFloat(orderSummary.subtotal);
        const tax = parseFloat(orderSummary.tax);
        const shipping = parseFloat(orderSummary.shipping);
        const discountAmount = parseFloat(response.discountAmount);
        const newTotal = subtotal + tax + shipping - discountAmount;
  
        setOrderSummary(prevSummary => ({
          ...prevSummary,
          discount: discountAmount,
          total: newTotal
        }));
  
        setCouponError("");
        setCouponCode("");
        toast.success("Coupon applied successfully!");
      } else {
        throw new Error(response?.message || 'Failed to apply coupon');
      }
    } catch (error) {
      console.error("Coupon application error:", error);
      
      const errorMessage = error.message || "Failed to apply coupon";
      setCouponError(errorMessage);
      toast.error(errorMessage);
      
      // Reset applied coupon if there's an error
      setAppliedCoupon(null);
    }
  };
  
  // Add a function to check if a coupon can still be used
  const checkCouponValidity = async (couponId, userId) => {
    try {
      // Instead of calling a separate validate endpoint, use the apply coupon endpoint
      const cartTotal = orderSummary.subtotal;
      const couponDetails = await couponService.applyCoupon({
        code: appliedCoupon.code,
        cartTotal,
        userId,
        appliedCouponId: couponId
      });
      return couponDetails.success;
    } catch (error) {
      console.error("Coupon validation error:", error);
      return false;
    }
  };
  
  // Add this effect to check coupon validity when component mounts or cart changes
  useEffect(() => {
    const validateExistingCoupon = async () => {
      if (appliedCoupon && appliedCoupon.couponId) {
        const userId = getUserIdFromToken();
        const isValid = await checkCouponValidity(appliedCoupon.couponId, userId);
        
        if (!isValid) {
          setAppliedCoupon(null);
          setCouponError("The applied coupon is no longer valid");
          toast.error("The applied coupon has expired or reached its usage limit");
          
          // Reset the order summary discount
          setOrderSummary(prevSummary => ({
            ...prevSummary,
            discount: 0,
            total: prevSummary.subtotal + prevSummary.tax + prevSummary.shipping
          }));
        }
      }
    };
  
    validateExistingCoupon();
  }, [cartItems, appliedCoupon]);

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");

    const subtotal = parseFloat(orderSummary.subtotal);
    const tax = parseFloat(orderSummary.tax);
    const shipping = parseFloat(orderSummary.shipping);

    const newTotal = subtotal + tax + shipping;

    setOrderSummary({
      ...orderSummary,
      discount: 0,
      total: newTotal
    });

    toast.success("Coupon removed successfully");
  };


  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };
  const handleRazorpayPayment = async (orderData) => {
    const res = await loadRazorpay();
    if (!res) {
      toast.error('Razorpay SDK failed to load. Please try again later.');
      return false;
    }
  
    try {
      // Ensure orderData includes the complete total with tax and shipping
      const completeOrderData = {
        ...orderData,
        // Make sure to use the total that includes tax and shipping
        totalAmount: orderSummary.total // This now includes subtotal + tax + shipping - discount
      };
  
      const response = await orderService.createOrder(completeOrderData);
      
      if (!response || !response.success || !response.razorpayOrder || !response.razorpayOrder.id) {
        throw new Error('Invalid order response structure');
      }
  
      const storeOrderId = response.data.orderId;
  
      return new Promise((resolve, reject) => {
        const options = {
          key: "rzp_test_OjGNfvyaKeJQu5",
          // Convert to smallest currency unit (paise for INR)
          amount: Math.round(orderSummary.total * 100), // Convert to paise and ensure it's rounded
          currency: response.razorpayOrder.currency,
          name: 'Your Store Name',
          description: 'Order Payment',
          order_id: response.razorpayOrder.id,
          retry: {
            enabled: false
          },
          handler: async function (razorpayResponse) {
            try {
              const verificationResponse = await orderService.verifyPayment({
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
                orderId: storeOrderId
              });
               
              if (verificationResponse.success) {
                toast.success("Payment successful!");
                navigate("/user/success", {
                  state: {
                    orderId: storeOrderId,
                    orderDetails: response.data
                  },
                  replace: true
                });
                resolve(true);
              } else {
                throw new Error(verificationResponse.message || 'Payment verification failed');
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              navigate("/user/failure", {
                state: {
                  orderId: storeOrderId,
                  reason: error.message || 'Payment verification failed'
                },
                replace: true
              });
              reject(error);
            }
          },
          prefill: {
            name: selectedAddress?.full_name || '',
            contact: selectedAddress?.phone_number || '',
          },
          notes: {
            shipping_address: `${selectedAddress?.street}, ${selectedAddress?.city}, ${selectedAddress?.state} ${selectedAddress?.pincode}`,
            order_summary: JSON.stringify({
              subtotal: orderSummary.subtotal,
              tax: orderSummary.tax,
              shipping: orderSummary.shipping,
              discount: orderSummary.discount,
              total: orderSummary.total
            })
          },
          theme: {
            color: '#9333EA'
          },
          modal: {
            ondismiss: () => {
              console.error('Payment modal dismissed', {
                storeOrderId,
                timestamp: new Date().toISOString()
              });
          
              navigate("/user/failure", {
                state: {
                  orderId: storeOrderId,
                  reason: 'Payment cancelled by user'
                },
                replace: true
              });
              reject(new Error('Payment cancelled'));
            }
          }
        };
  
        const paymentObject = new window.Razorpay(options);
        
        paymentObject.on('payment.failed', function (response) {
          window.Razorpay.close();
          
          console.error('Payment failed:', response.error);
          
          navigate("/user/failure", {
            state: {
              orderId: storeOrderId,
              reason: response.error.description || 'Payment failed'
            },
            replace: true
          });
          reject(new Error(response.error.description || 'Payment failed'));
        });
  
        paymentObject.open();
      });
    } catch (error) {
      console.error('Order creation failed:', error);
      navigate("/user/failure", {
        state: {
          reason: error.message || 'Failed to create order'
        },
        replace: true
      });
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-xl font-semibold text-gray-700">Loading checkout...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Error Loading Checkout
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-500 text-white px-6 py-2 rounded-full hover:bg-purple-600 transition duration-300 transform hover:scale-105"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              No Delivery Addresses Found
            </h2>
            <p className="text-gray-600 mb-6">
              Please add a delivery address to continue checkout.
            </p>
            <button
              onClick={() => navigate("/user/address")}
              className="bg-purple-500 text-white px-6 py-2 rounded-full hover:bg-purple-600 transition duration-300 transform hover:scale-105"
            >
              Add New Address
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Your Cart is Empty
            </h2>
            <p className="text-gray-600 mb-6">
              Add items to your cart to proceed with checkout.
            </p>
            <button
              onClick={() => navigate("/user/shop")}
              className="bg-purple-500 text-white px-6 py-2 rounded-full hover:bg-purple-600 transition duration-300 transform hover:scale-105"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden">
          <div className="p-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">
              Checkout
            </h1>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-8">
                {/* Delivery Address Section */}
                <section className="bg-gray-50 rounded-2xl p-6 transition-all duration-300 hover:shadow-md">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                    <MapPin className="w-6 h-6 mr-2 text-purple-500" />
                    Delivery Address
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div
                        key={address._id}
                        className={`border rounded-xl p-4 cursor-pointer transition-all duration-300 ${selectedAddress?._id === address._id
                          ? "border-purple-500 bg-purple-50 shadow-md"
                          : "hover:border-gray-400 hover:shadow-sm"
                          }`}
                        onClick={() => setSelectedAddress(address)}
                      >
                        <p className="font-semibold text-gray-800">{address.full_name}</p>
                        <p className="text-sm text-gray-600">{address.street}</p>
                        <p className="text-sm text-gray-600">
                          {address.city}, {address.state} {address.pincode}
                        </p>
                        <p className="text-sm text-gray-600">Phone: {address.phone_number}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(true)}
                    className="mt-4 w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-300 transform hover:scale-105"
                  >
                    <Plus className="inline-block w-5 h-5 mr-2" />
                    Add New Address
                  </button>
                </section>

                {/* Payment Method Section */}
                <section className="bg-gray-50 rounded-2xl p-6 transition-all duration-300 hover:shadow-md">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                    <CreditCardIcon className="w-6 h-6 mr-2 text-purple-500" />
                    Payment Method
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`border rounded-xl p-4 cursor-pointer transition-all duration-300 ${selectedPaymentMethod?.id === method.id
                          ? "border-purple-500 bg-purple-50 shadow-md"
                          : "hover:border-gray-400 hover:shadow-sm"
                          }`}
                        onClick={() => setSelectedPaymentMethod(method)}
                      >
                        <div className="flex items-center justify-center">
                          <method.icon className="w-8 h-8 text-purple-500 mb-2" />
                        </div>
                        <p className="font-semibold text-gray-800 text-center">{method.name}</p>
                        {method.id === "cash_on_delivery" && (
                          <p className="text-xs text-gray-600 text-center mt-1">
                            Pay when your order arrives
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Coupons Section */}
                <section className="bg-gray-50 rounded-2xl p-6 transition-all duration-300 hover:shadow-md">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                    <Tag className="w-6 h-6 mr-2 text-purple-500" />
                    Coupons
                  </h2>
                  <div className="space-y-4">
                    {Array.isArray(coupons) && coupons.length > 0 ? (
                      coupons.map((coupon, index) => (
                        <div
                          key={`coupon-${coupon._id || index}`}
                          className="border rounded-xl p-4 transition-all duration-300 hover:shadow-sm"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-800">{coupon.code}</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(coupon.code);
                                    toast.success('Coupon code copied!');
                                  }}
                                  className="text-gray-500 hover:text-purple-600 p-1 rounded-md 
                                    hover:bg-purple-50 transition-all duration-300"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              </div>
                              <p className="text-sm text-gray-600">{coupon.offerPercentage}% off</p>
                              {coupon.description && (
                                <p className="text-xs text-gray-500">{coupon.description}</p>
                              )}
                              {coupon.expiresOn && (
                                <p className="text-xs text-gray-400">
                                  Expires: {new Date(coupon.expiresOn).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No coupons available</p>
                    )}

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Enter coupon code"
                          className="flex-grow px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-300"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-300 transform hover:scale-105"
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-red-600 text-sm mt-2">{couponError}</p>
                      )}
                    </div>

                    {appliedCoupon && (
                      <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-green-800">
                              Applied: {appliedCoupon.code}
                            </p>
                            <p className="text-sm text-green-600">
                              {appliedCoupon.discountValue}% off
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="text-red-600 hover:text-red-800 font-medium transition duration-300 px-3 py-1 rounded-lghover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Order Summary Section */}
              <div className="bg-gray-50 rounded-2xl p-6 h-fit sticky top-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                  <Truck className="w-6 h-6 mr-2 text-purple-500" />
                  Order Summary
                </h2>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.product._id} className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="text-gray-800">{item.product.name}</p>
                        <p className="text-sm text-gray-600">
                          Size: {item.size} | Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-800 font-medium">
                          ₹{((item.discountedPrice || item.price) * item.quantity).toFixed(2)}
                        </p>
                        {item.discountedPrice && item.discountedPrice < item.price && (
                          <p className="text-sm text-gray-500 line-through">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-800 font-medium">
                        ₹{orderSummary.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax (8%)</span>
                      <span className="text-gray-800 font-medium">
                        ₹{orderSummary.tax.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-gray-800 font-medium">
                        ₹{orderSummary.shipping.toFixed(2)}
                      </span>
                    </div>
                    {orderSummary.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-₹{orderSummary.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg mt-4">
                      <span>Total</span>
                      <span>₹{orderSummary.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    type="submit"
                    disabled={!selectedAddress || !selectedPaymentMethod || loading}
                    className={`w-full py-4 rounded-xl text-white font-semibold text-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${!selectedAddress || !selectedPaymentMethod || loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700"
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
      <AddressFormModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onAddressAdded={handleAddressAdded}
      />
    </div>
  );
};

export default CheckoutPage;

