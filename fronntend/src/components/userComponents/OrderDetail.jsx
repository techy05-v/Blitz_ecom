import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Truck, Package, Clock, XCircle, ArrowLeft, CreditCard, MapPin, Home, Briefcase, Map, AlertCircle } from 'lucide-react';
import orderService from '../../api/orderService/orderService';
import ConfirmationModal from '../../confirmationModal/ConfirmationMadal';

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancellingItemId, setCancellingItemId] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await orderService.getOrderById(orderId);
        if (response && response.order) {
          setOrder(response.order);
        } else {
          setError('No order data received');
        }
      } catch (err) {
        setError(err.message || 'Error fetching order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleCancelOrder = () => {
    setCancellingItemId(null);
    setIsModalOpen(true);
  };

  const handleCancelItem = (itemId) => {
    setCancellingItemId(itemId);
    setIsModalOpen(true);
  };

  const confirmCancelItem = async () => {
    setIsModalOpen(false);
    setCancelLoading(true);
    try {
      const response = await orderService.cancelOrderItem(
        orderId,
        cancellingItemId,
        "customer requested cancellation"
      );

      if (response && response.order) {
        // Update both the item status and the overall order
        setOrder(prevOrder => ({
          ...response.order,
          items: prevOrder.items.map(item =>
            item._id === cancellingItemId
              ? { ...item, itemStatus: 'Cancelled' }  // Changed from status to itemStatus
              : item
          )
        }));
      }
    } catch (err) {
      setError('Failed to cancel item: ' + err.message);
    } finally {
      setCancelLoading(false);
      setCancellingItemId(null);
    }
  };

  const confirmCancelOrder = async () => {
    setIsModalOpen(false);
    setCancelLoading(true);
    try {
      const response = await orderService.cancelOrder(
        orderId,
        'Customer requested cancellation'
      );
      if (response && response.order) {
        setOrder(response.order);
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

  const OrderItem = ({ item }) => {
    return (
      <div className={`flex items-center p-4 rounded-lg border transition-all duration-200 ${item.status === 'cancelled' ? 'bg-red-50' : 'bg-gray-50 hover:shadow-md'}`}>
        {item.product.imageUrl && (
          <img
            src={item.product.imageUrl || "/placeholder.svg"}
            alt={item.product.productName}
            className="w-16 h-16 object-cover rounded-md mr-4"
          />
        )}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-800">
                {item.product.productName}
              </h3>
              <p className="text-sm text-gray-600">
                Size: {item.size} | Quantity: {item.quantity}
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                ₹{item.discountedPrice.toFixed(2)}
                {item.discountedPrice !== item.price && (
                  <span className="line-through text-gray-500 ml-2 text-xs">
                    ₹{item.price.toFixed(2)}
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-col items-end">
              {item.status === 'cancelled' ? (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  Cancelled
                </span>
              ) : (
                ['pending', 'processing'].includes(order.orderStatus.toLowerCase()) && (
                  <button
                    onClick={() => handleCancelItem(item._id)}
                    disabled={cancelLoading}
                    className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors duration-200"
                  >
                    Cancel Item
                  </button>
                )
              )}
            </div>
          </div>
          {item.status === 'cancelled' && item.cancelReason && (
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

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-2xl font-semibold text-gray-700 bg-white px-6 py-4 rounded-lg shadow-md">
          Order not found
        </div>
      </div>
    );
  }

  // Update the activeItems and cancelledItems filters
  const activeItems = order.items.filter(item => item.itemStatus !== 'Cancelled');
  const cancelledItems = order.items.filter(item => item.itemStatus === 'Cancelled');

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
                    <OrderItem key={index} item={item} />
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
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium">{order.paymentMethod.replace(/_/g, ' ').toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Status</span>
                  <span className={`font-medium ${order.paymentStatus === 'completed' ? 'text-green-600' :
                      order.paymentStatus === 'failed' ? 'text-red-600' :
                        order.paymentStatus === 'refunded' ? 'text-blue-600' :
                          'text-yellow-600'
                    }`}>
                    {order.paymentStatus.toUpperCase()}
                  </span>
                </div>
                {order.estimatedDeliveryDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Estimated Delivery</span>
                    <span className="font-medium">{new Date(order.estimatedDeliveryDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items Total</span>
                  <span className="font-medium">₹{order.items.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-green-600 font-medium">
                    -₹{(order.items.reduce((total, item) => total + ((item.price - item.discountedPrice) * item.quantity), 0)).toFixed(2)}
                  </span>
                </div>
                {order.orderNotes && (
                  <div className="pt-2 border-t border-gray-200 mt-2">
                    <span className="text-gray-600 text-sm">Order Notes:</span>
                    <p className="text-sm text-gray-800 mt-1">{order.orderNotes}</p>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200 mt-2">
                  <span className="text-gray-900">Total Amount</span>
                  <span className="text-blue-600">₹{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Cancelled Items */}
            {cancelledItems.length > 0 && (
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Cancelled Items ({cancelledItems.length})
                </h2>
                <div className="space-y-4">
                  {cancelledItems.map((item, index) => (
                    <OrderItem key={index} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 flex justify-between items-center mt-6">
            <Link
              to="/user/orders"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-300 flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Link>
            {['pending', 'processing'].includes(order.orderStatus.toLowerCase()) && (
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
        onClose={() => setIsModalOpen(false)}
        onConfirm={cancellingItemId ? confirmCancelItem : confirmCancelOrder}
        title={cancellingItemId ? "Cancel Item" : "Cancel Order"}
        message={cancellingItemId
          ? "Are you sure you want to cancel this item? This action cannot be undone."
          : "Are you sure you want to cancel this order? This action cannot be undone."}
      />
    </div>
  );
};

export default OrderDetails;

