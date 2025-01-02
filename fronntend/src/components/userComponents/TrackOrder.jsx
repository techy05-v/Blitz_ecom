import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Package, CheckCircle } from 'lucide-react';
import orderService from '../../api/orderService/orderService';

const OrderTracking = () => {
  const [orderId, setOrderId] = useState('');
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleTrack = async (e) => {
    e.preventDefault();
    try {
      const response = await orderService.trackOrder(orderId);
      setTrackingInfo(response.trackingInfo);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to track order');
      setTrackingInfo(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return <Package className="text-blue-500" />;
      case 'shipped':
        return <Truck className="text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Track Your Order</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleTrack} className="mb-6">
            <div className="flex items-center">
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter your Order ID"
                className="flex-grow p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Track
              </button>
            </div>
          </form>

          {error && (
            <div className="text-red-600 mb-4">{error}</div>
          )}

          {trackingInfo && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Order #{trackingInfo.orderId}</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getStatusIcon(trackingInfo.status)}
                  <span className="ml-2 font-medium">{trackingInfo.status.charAt(0).toUpperCase() + trackingInfo.status.slice(1)}</span>
                </div>
                <span className="text-sm text-gray-500">
                  Estimated Delivery: {new Date(trackingInfo.estimatedDelivery).toLocaleDateString()}
                </span>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Tracking Updates</h3>
                {trackingInfo.updates.map((update, index) => (
                  <div key={index} className="mb-2">
                    <p className="text-sm text-gray-600">{new Date(update.timestamp).toLocaleString()}</p>
                    <p>{update.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => navigate('/user/dashboard')}
          className="mt-4 text-blue-600 hover:underline"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default OrderTracking;

