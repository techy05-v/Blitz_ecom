import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Truck, Package, Clock, XCircle, ArrowLeft, CreditCard, MapPin, Home, Briefcase, Map, AlertCircle, RefreshCw } from 'lucide-react';
import orderService from '../../api/orderService/orderService';
import ConfirmationModal from '../../confirmationModal/ConfirmationMadal';
import { handleRequestReturn } from '../../api/returnService/returnService';
import InvoiceDownload from '../../private/user/InvoiceDownload';
import { toast } from 'sonner';
const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancellingItemId, setCancellingItemId] = useState(null);
  const [returningItemId, setReturningItemId] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);


  const fetchOrderDetails = async () => {
    try {
      const response = await orderService.getOrderById(orderId);
      console.log('API Response:', response);
      if (response && response.order) {
        const validatedOrder = {
          ...response.order,
          originalAmount: response.order.originalAmount || 0,
          currentAmount: response.order.currentAmount || 0,
          items: Array.isArray(response.order.items)
            ? response.order.items.map(item => ({
              ...item,
              currentPrice: item.currentPrice || 0,
              originalPrice: item.originalPrice || 0,
              quantity: item.quantity || 0,
              size: item.size || 'N/A',
              itemStatus: item.itemStatus || 'Pending',
              returnStatus: item.returnStatus || null,
              returnReason: item.returnReason || ''
            }))
            : []
        };
        console.log('Validated Order:', validatedOrder);
        setOrder(validatedOrder);
      } else {
        setError('No order data received');
      }
    } catch (err) {
      setError(err.message || 'Error fetching order details');
    } finally {
      setLoading(false);
    }
  };
  const handleCancelOrder = () => {
    setCancellingItemId(null);
    setIsModalOpen(true);
  };
  const handleReturnItem = (itemId) => {
    setReturningItemId(itemId);
    setReturnReason(''); // Reset reason when opening modal
    setIsModalOpen(true);
  };

  const handleReturnReasonChange = (e) => {
    setReturnReason(e.target.value);
  };

  // functions to confrim return request 
  const confirmReturnItem = async () => {
    if (!returnReason.trim()) {
      setError('Please provide a reason for return');
      return;
    }

    setReturnLoading(true);
    try {
      const response = await handleRequestReturn({
        orderId: order.orderId,
        itemId: returningItemId,
        reason: returnReason
      });

      if (response.success) {
        // Fetch fresh order data after successful return request
        await fetchOrderDetails();
        setError(null);
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      setError(`Failed to request return: ${err.message}`);
    } finally {
      setReturnLoading(false);
      setIsModalOpen(false);
      setReturningItemId(null);
      setReturnReason('');
    }
  };
  const handleItemCancel = (itemId) => {
    if (!itemId) {
      console.error('No item ID provided for cancellation');
      setError('Unable to cancel item: Invalid item ID');
      return;
    }
    console.log('Cancel button clicked for item:', itemId);
    setCancellingItemId(itemId);
    setIsModalOpen(true);
  };

  const confirmCancelItem = async () => {
    setIsModalOpen(false);
    setCancelLoading(true);

    try {
      if (!orderId || !cancellingItemId) {
        throw new Error('Order ID and Item ID are required');
      }

      console.log('Attempting to cancel item:', {
        orderId,
        itemId: cancellingItemId
      });

      const response = await orderService.cancelOrderItem(
        orderId,
        cancellingItemId,
        "Customer requested cancellation"
      );

      console.log('Cancel item response:', response);

      if (response && response.success && response.order) {
        // Update the order state with the new data
        setOrder(prevOrder => ({
          ...prevOrder,
          ...response.order,
          items: response.order.items.map(item => ({
            ...item,
            currentPrice: item.currentPrice || 0,
            originalPrice: item.originalPrice || 0,
            quantity: item.quantity || 0,
            size: item.size || 'N/A',
            itemStatus: item.itemStatus || 'Pending'
          }))
        }));
        setError(null); // Clear any existing errors
      } else {
        throw new Error('Invalid response format from cancel item request');
      }
    } catch (err) {
      console.error('Error in confirmCancelItem:', err);
      setError(`Failed to cancel item: ${err.message || 'Unknown error'}`);
    } finally {
      setCancelLoading(false);
      setCancellingItemId(null);
    }
  };

  const OrderItem = ({ item, handleCancelItem }) => {
    if (!item) return null;

    const formatPrice = (amount) => {
      return typeof amount === 'number' ? amount.toFixed(2) : '0.00';
    };

    const calculateDiscount = (originalPrice, discountedPrice) => {
      if (!originalPrice || !discountedPrice) return 0;
      const discount = originalPrice - discountedPrice;
      const discountPercentage = (discount / originalPrice) * 100;
      return discountPercentage.toFixed(0);
    };

    const getReturnStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case 'return_pending':
          return 'bg-yellow-100 text-yellow-800';
        case 'return_approved':
          return 'bg-green-100 text-green-800';
        case 'return_rejected':
          return 'bg-red-100 text-red-800';
        case 'return_completed':
          return 'bg-blue-100 text-blue-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    const formatReturnStatus = (status) => {
      return status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A';
    };

    const canCancelItem = order?.orderStatus &&
      ['Pending', 'Processing'].includes(order.orderStatus) &&
      item.itemStatus !== 'Cancelled';

    const canReturnItem = order?.orderStatus === "Delivered" &&
      item.itemStatus === "Delivered" &&
      !item.returnStatus &&
      item.itemStatus !== 'Return_Pending';

    const isReturnRequested = item.itemStatus === 'Return_Pending';

    return (
      <div className={`flex items-center p-4 rounded-lg border transition-all duration-200 ${
        item.itemStatus === 'Cancelled' ? 'bg-red-50' :
        isReturnRequested ? 'bg-yellow-50' :
        item.returnStatus ? 'bg-blue-50' : 'bg-gray-50 hover:shadow-md'
      }`}>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-800">
                {item.productName || 'Unnamed Product'}
              </h3>
              <p className="text-sm text-gray-600">
                Size: {item.size || 'N/A'} | Quantity: {item.quantity || 0}
              </p>
              <div className="mt-2 space-y-1">
              {item.price !== item.discountedPrice && (
                <p className="text-sm text-gray-500">
                  <span className="line-through">₹{formatPrice(item.price)}</span>
                  <span className="ml-2 text-green-600">
                    {calculateDiscount(item.price, item.discountedPrice)}% off
                  </span>
                </p>
              )}
              <p className="text-lg font-semibold text-gray-900">
                ₹{formatPrice(item.discountedPrice)}
              </p>
              {item.refundAmount > 0 && (
                <p className="text-sm text-green-600">
                  Refund Amount: ₹{formatPrice(item.refundAmount)}
                </p>
              )}
            </div>
            </div>
            <div className="flex flex-col items-end">
              {item.itemStatus === 'Cancelled' ? (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  Cancelled
                </span>
              ) : isReturnRequested ? (
                <span className={`px-2 py-1 ${getReturnStatusColor('return_pending')} text-xs font-medium rounded-full`}>
                  Return Requested
                </span>
              ) : item.returnStatus ? (
                <span className={`px-2 py-1 ${getReturnStatusColor(item.returnStatus)} text-xs font-medium rounded-full`}>
                  Return {formatReturnStatus(item.returnStatus)}
                </span>
              ) : canReturnItem ? (
                <button
                  onClick={() => handleReturnItem(item.product)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Return Item
                </button>
              ) : canCancelItem && (
                <button
                  onClick={() => handleCancelItem(item.product)}
                  className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors duration-200 flex items-center"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Cancel Item
                </button>
              )}
            </div>
          </div>

          {/* Return Status Information */}
          {isReturnRequested && (
            <div className="mt-3 p-2 bg-yellow-100 rounded-md">
              <div className="flex items-center text-yellow-700">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="font-semibold">Return Requested</span>
              </div>
              {item.returnReason && (
                <p className="text-sm text-yellow-600 mt-1">
                  Reason: {item.returnReason}
                </p>
              )}
            </div>
          )}

          {/* Refund Information */}
          {item.refundStatus && item.refundStatus !== 'none' && (
            <div className="mt-3 p-2 bg-green-100 rounded-md">
              <div className="flex items-center text-green-700">
                <CreditCard className="w-4 h-4 mr-2" />
                <span className="font-semibold">Refund Status: {formatReturnStatus(item.refundStatus)}</span>
              </div>
              {item.refundDate && (
                <p className="text-sm text-green-600 mt-1">
                  Refunded on: {new Date(item.refundDate).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Cancellation Information */}
          {item.cancelReason && (
            <div className="mt-3 p-2 bg-red-100 rounded-md">
              <div className="flex items-center text-red-700">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="font-semibold">Cancellation Reason:</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{item.cancelReason}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);
  const confirmCancelOrder = async () => {
    setIsModalOpen(false);
    setCancelLoading(true);
    try {
      const response = await orderService.cancelOrder(
        orderId,
        'Customer requested cancellation'
      );
      if (response && response.order) {
        setOrder(prevOrder => ({
          ...prevOrder,
          ...response.order,
          items: Array.isArray(response.order.items)
            ? response.order.items.map(item => ({
              ...item,
              currentPrice: item.currentPrice || 0,
              originalPrice: item.originalPrice || 0,
              quantity: item.quantity || 0,
              size: item.size || 'N/A',
              itemStatus: item.itemStatus || 'Pending'
            }))
            : prevOrder.items
        }));
      }
    } catch (err) {
      setError('Failed to cancel order: ' + err.message);
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-500',
      processing: 'text-blue-500',
      shipped: 'text-purple-500',
      delivered: 'text-green-500',
      cancelled: 'text-red-500'
    };
    return colors[status.toLowerCase()] || 'text-gray-500';
  };

  const getAddressTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'home':
        return <Home className="w-5 h-5 mr-2" />;
      case 'work':
        return <Briefcase className="w-5 h-5 mr-2" />;
      default:
        return <Map className="w-5 h-5 mr-2" />;
    }
  };

  const OrderStatusBar = ({ currentStatus }) => {
    const normalizedStatus = currentStatus.toLowerCase();

    const steps = [
      { key: 'pending', label: 'Order Placed', icon: <Clock className="w-6 h-6" /> },
      { key: 'processing', label: 'Processing', icon: <Package className="w-6 h-6" /> },
      { key: 'shipped', label: 'Shipped', icon: <Truck className="w-6 h-6" /> },
      { key: 'delivered', label: 'Delivered', icon: <CheckCircle className="w-6 h-6" /> }
    ];

    const currentStepIndex = steps.findIndex(step => step.key === normalizedStatus);

    return (
      <div className="w-full my-8 px-4">
        {normalizedStatus === 'cancelled' ? (
          <div className="flex flex-col items-center justify-center p-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-500 text-white animate-pulse">
              <XCircle className="w-8 h-8" />
            </div>
            <span className="mt-4 text-xl font-medium text-red-500">Order Cancelled</span>
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.key} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-16 h-16 flex items-center justify-center rounded-full border-4 transition-all duration-500 ease-in-out
                      ${index <= currentStepIndex
                        ? 'bg-blue-500 border-blue-300 text-white shadow-lg'
                        : 'bg-white border-gray-300 text-gray-400'}`}
                  >
                    {index < currentStepIndex ? (
                      <CheckCircle className="w-8 h-8 text-white" />
                    ) : (
                      <div className={`${index === currentStepIndex ? 'animate-bounce' : ''}`}>
                        {step.icon}
                      </div>
                    )}
                  </div>
                  <span className={`mt-2 text-sm font-medium text-center
                    ${index <= currentStepIndex ? 'text-blue-600' : 'text-gray-500'}`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="absolute top-8 left-0 w-full">
              <div className="h-1 bg-gray-200" />
              <div
                className="h-1 bg-blue-500 absolute top-0 left-0 transition-all duration-500 ease-in-out"
                style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };


  const OrderSummary = () => {
    const [error, setError] = useState(null)
    const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false)
    const [isLoadingScript, setIsLoadingScript] = useState(true)
  
    useEffect(() => {
      const loadRazorpay = async () => {
        if (window.Razorpay) {
          setIsRazorpayLoaded(true)
          setIsLoadingScript(false)
          return
        }
  
        return new Promise((resolve) => {
          const script = document.createElement("script")
          script.src = "https://checkout.razorpay.com/v1/checkout.js"
          script.async = true
          script.onload = () => {
            setIsRazorpayLoaded(true)
            setIsLoadingScript(false)
            resolve(true)
          }
          script.onerror = () => {
            setError("Failed to load Razorpay SDK")
            setIsLoadingScript(false)
            resolve(false)
          }
          document.body.appendChild(script)
        })
      }
  
      loadRazorpay()
    }, [])
  
    if (!order) return null
  
    const formatPrice = (amount) => {
      return typeof amount === "number" ? amount.toFixed(2) : "0.00"
    }
  
    const handleRepayment = async () => {
      try {
        // Clear any previous errors
        setError(null)
  
        if (!isRazorpayLoaded) {
          throw new Error("Payment system is not ready. Please refresh the page.")
        }
  
        // Get the Razorpay key from environment variable
        const RAZORPAY_KEY_ID = "rzp_test_OjGNfvyaKeJQu5"
  
        if (!RAZORPAY_KEY_ID) {
          throw new Error("Payment configuration is missing")
        }
  
        const response = await orderService.initiateRepayment(order.orderId)
  
        if (!response.success || !response.razorpayOrderId) {
          throw new Error(response.message || "Invalid payment response from server")
        }
  
        // Create new instance only after confirming script is loaded
        const options = {
          key: RAZORPAY_KEY_ID,
          amount: response.amount,
          currency: response.currency || "INR",
          name: "Your Store Name",
          description: `Repayment for order ${order.orderId}`,
          order_id: response.razorpayOrderId,
          handler: async (razorpayResponse) => {
            try {
              const verifyResponse = await orderService.verifyPayment({
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
              })
  
              if (verifyResponse.success) {
                toast.success("Payment successful!")
                setTimeout(() => window.location.reload(), 1500)
              } else {
                throw new Error(verifyResponse.message || "Payment verification failed")
              }
            } catch (error) {
              setError(`Payment verification failed: ${error.message}`)
              toast.error("Payment verification failed")
            }
          },
          prefill: {
            name: order.shippingAddress?.fullName || "",
            email: order.user?.email || "",
            contact: order.shippingAddress?.phoneNumber || "",
          },
          theme: {
            color: "#3B82F6",
          },
          modal: {
            ondismiss: () => {
              setError("Payment cancelled by user")
            },
          },
        }
  
        // Create new instance only if Razorpay is definitely loaded
        if (typeof window.Razorpay === "function") {
          const rzp = new window.Razorpay(options)
          rzp.on("payment.failed", (response) => {
            setError(`Payment failed: ${response.error.description}`)
            toast.error("Payment failed")
          })
          rzp.open()
        } else if (window.Razorpay) {
          const rzp = new window.Razorpay(options)
          rzp.on("payment.failed", (response) => {
            setError(`Payment failed: ${response.error.description}`)
            toast.error("Payment failed")
          })
          rzp.open()
        } else {
          throw new Error("Payment system initialization failed")
        }
      } catch (err) {
        setError(`Failed to process repayment: ${err.message}`)
        toast.error("Payment initialization failed")
      }
    }
  
    const showRepayButton =
      ["card", "upi", "razorpay", "wallet"].includes(order.paymentMethod?.toLowerCase()) &&
      ["pending", "failed"].includes(order.paymentStatus?.toLowerCase())
  
    return (
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Original Amount</span>
          <span className="font-medium">₹{formatPrice(order.originalAmount)}</span>
        </div>
  
        {order.couponApplied && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Coupon Discount</span>
            <span className="text-green-600 font-medium">-₹{formatPrice(order.couponApplied.discountAmount)}</span>
          </div>
        )}
  
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Current Amount</span>
          <span className="font-medium">₹{formatPrice(order.currentAmount)}</span>
        </div>
  
        {order.totalRefundAmount > 0 && (
          <div className="flex justify-between text-sm text-blue-600">
            <span>Total Refund Amount</span>
            <span className="font-medium">₹{formatPrice(order.totalRefundAmount)}</span>
          </div>
        )}
  
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment Status</span>
            <span
              className={`font-medium ${
                order.paymentStatus === "completed"
                  ? "text-green-600"
                  : order.paymentStatus === "failed"
                    ? "text-red-600"
                    : "text-yellow-600"
              }`}
            >
              {(order.paymentStatus || "PENDING").toUpperCase()}
            </span>
          </div>
  
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
  
          {showRepayButton && (
            <button
              onClick={handleRepayment}
              className="w-full mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md 
                         transition-colors duration-200 flex items-center justify-center space-x-2
                         disabled:bg-blue-400 disabled:cursor-not-allowed"
              disabled={!isRazorpayLoaded}
            >
              <CreditCard className="w-4 h-4" />
              <span>{isRazorpayLoaded ? "Retry Payment" : "Loading payment system..."}</span>
            </button>
          )}
        </div>
      </div>
    )
  }
  
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-2xl font-semibold text-gray-700 animate-pulse">
          Loading order details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl font-semibold text-red-600 bg-red-100 px-6 py-4 rounded-lg shadow-md">
          {error}
        </div>
      </div>
    );
  }

  if (!order || !order.items) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-2xl font-semibold text-gray-700 bg-white px-6 py-4 rounded-lg shadow-md">
          Order not found
        </div>
      </div>
    );
  }

  const activeItems = order.items.filter(item => item.itemStatus !== 'Cancelled') || [];
  const cancelledItems = order.items.filter(item => item.itemStatus === 'Cancelled') || [];

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Order #{order.orderId}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.orderStatus)} bg-white bg-opacity-20`}>
                {order.orderStatus}
              </span>
            </div>
            <p className="text-sm mt-1 opacity-80">
              Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
            </p>
          </div>

          {/* Order Status Bar */}
          <OrderStatusBar currentStatus={order.orderStatus} />
          <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Items */}
            {activeItems.length > 0 && (
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Active Items ({activeItems.length})
                </h2>
                <div className="space-y-4">
                  {activeItems.map((item, index) => (
                    <OrderItem
                      key={index}
                      item={item}
                      handleCancelItem={handleItemCancel}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Shipping Address */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-500" />
                Shipping Address
              </h2>
              {order.shippingAddress && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    {console.log(order.shippingAddress)}
                    {getAddressTypeIcon(order.shippingAddress.address_type)}
                    <span className="text-sm font-medium text-blue-600 capitalize">
                      {order.shippingAddress.address_type} Address
                    </span>
                    {order.shippingAddress.is_default && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-gray-800">{order.shippingAddress.full_name}</p>
                  <p className="text-sm text-gray-600">{order.shippingAddress.street_address}</p>
                  {order.shippingAddress.apartment && (
                    <p className="text-sm text-gray-600">{order.shippingAddress.apartment}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postal_code}
                  </p>
                  <p className="text-sm text-gray-600">{order.shippingAddress.country}</p>
                  {order.shippingAddress.landmark && (
                    <p className="text-sm text-gray-600">Landmark: {order.shippingAddress.landmark}</p>
                  )}
                  <p className="text-sm text-green-600 mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {order.shippingAddress.phone_number}
                  </p>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-blue-500" />
                Order Summary
              </h2>
              <OrderSummary />
            </div>

            {/* Cancelled Items */}
            {cancelledItems.length > 0 && (
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Cancelled Items ({cancelledItems.length})
                </h2>
                <div className="space-y-4">
                  {cancelledItems.map((item, index) => (
                    <OrderItem
                      key={index}
                      item={item}
                      handleCancelItem={handleItemCancel}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <InvoiceDownload orderId={order.orderId} orderStatus={order.orderStatus} />
          <div className="px-6 py-4 bg-gray-50 flex justify-between items-center mt-6">
            <Link
              to="/user/orders"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-300 flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Link>
            {['pending', 'processing'].includes(order.orderStatus.toLowerCase()) && activeItems.length > 0 && (
              <button
                onClick={handleCancelOrder}
                disabled={cancelLoading}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  ${cancelLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'} 
                  transition-all duration-300 flex items-center`}
              >
                {cancelLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Order
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-lg">
          <div className="flex items-center">
            <div className="py-1">
              <svg className="w-6 h-6 mr-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto pl-3"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCancellingItemId(null);
          setReturningItemId(null);
          setReturnReason('');
        }}
        onConfirm={returningItemId ? confirmReturnItem : (cancellingItemId ? confirmCancelItem : confirmCancelOrder)}
        title={returningItemId ? "Request Return" : (cancellingItemId ? "Cancel Item" : "Cancel Order")}
        message={
          returningItemId ? (
            <div className="space-y-4">
              <p>Please provide a reason for returning this item:</p>
              <textarea
                value={returnReason}
                onChange={handleReturnReasonChange}
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows="4"
                placeholder="Enter return reason..."
              />
            </div>
          ) : (
            cancellingItemId
              ? "Are you sure you want to cancel this item? This action cannot be undone."
              : "Are you sure you want to cancel this entire order? This action cannot be undone."
          )
        }
        confirmButtonText={
          returningItemId
            ? (returnLoading ? "Processing..." : "Submit Return Request")
            : (cancelLoading ? "Processing..." : "Confirm")
        }
        confirmButtonDisabled={
          (returningItemId && (!returnReason.trim() || returnLoading)) ||
          (!returningItemId && cancelLoading)
        }
      />

    </div>

  );
};

export default OrderDetails;

