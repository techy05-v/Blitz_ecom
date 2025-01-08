import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, orderDetails } = location.state || {};

  useEffect(() => {
    if (!orderId || !orderDetails) {
      console.log('No order details found, redirecting to orders page');
      navigate('/user/orders');
    }
  }, [orderId, orderDetails, navigate]);

  if (!orderId || !orderDetails) {
    return null; // Return null to avoid rendering anything while redirecting
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-green-500 p-6 text-center">
            <svg className="w-16 h-16 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <h1 className="text-3xl font-bold text-white mt-4">Order Placed Successfully!</h1>
          </div>
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Order Details</h2>
            <div className="mb-4">
              <p className="text-gray-600">Order ID: <span className="font-semibold">{orderId}</span></p>
              <p className="text-gray-600">Total Amount: <span className="font-semibold">₹{orderDetails.totalAmount.toFixed(2)}</span></p>
              <p className="text-gray-600">Payment Method: <span className="font-semibold">{orderDetails.paymentMethod}</span></p>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Items Ordered</h3>
            <ul className="mb-6">
              {orderDetails.items.map((item, index) => (
                <li key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <span className="text-gray-800">{item.product.name} (Size: {item.size})</span>
                  <span className="text-gray-600">Qty: {item.quantity}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between">
              <button
                onClick={() => navigate('/user/orders')}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                View All Orders
              </button>
              <button
                onClick={() => navigate('/user/shop')}
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;

