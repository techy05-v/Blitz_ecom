import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, CreditCard, ArrowRight, ShoppingBag, Loader2 } from 'lucide-react';

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const { orderId, orderDetails } = location.state || {};
        
        if (!orderId || !orderDetails) {
          throw new Error('No order details found');
        }

        // In a real app, you might want to fetch fresh data from the API here
        setOrderData({ orderId, orderDetails });
      } catch (err) {
        setError(err.message);
        console.error('Error fetching order details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [location.state]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error || 'Unable to load order details'}</p>
          <button
            onClick={() => navigate('/user/orders')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Orders
          </button>
        </div>
      </div>
    );
  }

  const { orderId, orderDetails } = orderData;
  const totalAmount = orderDetails.originalAmount ?? 0;
  const items = Array.isArray(orderDetails.items) ? orderDetails.items : [];

  const getStatusColor = (status) => {
    const statusColors = {
      'Pending': 'text-yellow-600',
      'Processing': 'text-blue-600',
      'Shipped': 'text-purple-600',
      'Delivered': 'text-green-600',
      'Cancelled': 'text-red-600'
    };
    return statusColors[status] || 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 animate-fadeIn">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-400 to-green-600 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute transform rotate-45 translate-x-1/2 translate-y-1/2">
                <div className="w-64 h-64 border-4 border-white rounded-full" />
              </div>
            </div>
            <div className="relative">
              <div className="animate-bounce mb-4">
                <CheckCircle className="w-16 h-16 text-white mx-auto" />
              </div>
              <h1 className="text-4xl font-bold text-white mt-4">Thank You for Your Order!</h1>
              <p className="text-white text-lg mt-2 opacity-90">
                Order Status: <span className="font-semibold">{orderDetails.orderStatus}</span>
              </p>
            </div>
          </div>

          {/* Order Details */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Order Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Package className="w-6 h-6 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Order ID</p>
                      <p className="font-semibold">{orderId}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-6 h-6 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-500">Payment Method</p>
                      <p className="font-semibold capitalize">{orderDetails.paymentMethod || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <ShoppingBag className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="font-semibold">₹{totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Items Ordered</h3>
                <div className="space-y-3">
                  {items.map((item, index) => {
                    const isProductPopulated = typeof item.product === 'object' && item.product !== null;
                    
                    return (
                      <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {isProductPopulated 
                                ? item.product.productName 
                                : `Product ID: ${item.product}`}
                            </p>
                            <div className="text-sm text-gray-500">
                              <p>Size: {item.size || 'N/A'}</p>
                              <p>Price: ₹{item.discountedPrice}</p>
                              <p className={getStatusColor(item.itemStatus)}>
                                Status: {item.itemStatus || 'Processing'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-gray-600">
                            Qty: {item.quantity || 0}
                          </div>
                          <div className="text-sm text-gray-500">
                            Total: ₹{(item.quantity * item.discountedPrice).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Status */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-sm text-gray-500">Payment Status</p>
                    <p className={`font-semibold ${orderDetails.paymentStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {orderDetails.paymentStatus?.toUpperCase()}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-sm text-gray-500">Order Status</p>
                    <p className={`font-semibold ${getStatusColor(orderDetails.orderStatus)}`}>
                      {orderDetails.orderStatus}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <button
                  onClick={() => navigate('/user/orders')}
                  className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transform hover:-translate-y-1 transition-all duration-200"
                >
                  <span>View All Orders</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/user/shop')}
                  className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-800 px-8 py-3 rounded-xl hover:bg-gray-200 transform hover:-translate-y-1 transition-all duration-200"
                >
                  <span>Continue Shopping</span>
                  <ShoppingBag className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;