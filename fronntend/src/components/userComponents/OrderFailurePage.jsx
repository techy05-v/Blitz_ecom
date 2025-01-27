import { XCircle } from 'lucide-react';  // Import the appropriate icon
import { useLocation } from 'react-router-dom';
const OrderFailurePage = () => {
  const location = useLocation();
  const { orderId, reason } = location.state || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <div className="mb-6">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-red-600 mb-4">Payment Failed</h2>
        </div>
        
        {orderId && (
          <p className="text-gray-700 mb-2">
            Order ID: <span className="font-semibold">{orderId}</span>
          </p>
        )}
        
        {reason && (
          <p className="text-gray-600 mb-6">
            Reason: {reason}
          </p>
        )}
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 transition duration-300"
          >
            Retry Payment
          </button>
          <button
            onClick={() => navigate("/user/cart")}
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-full hover:bg-gray-300 transition duration-300"
          >
            Back to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderFailurePage;