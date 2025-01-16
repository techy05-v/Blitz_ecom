import React, { useState, useEffect } from 'react';
import orderService from "../../api/orderService/orderService";
import { Link } from 'react-router-dom';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchOrders();
  }, [currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);  // Clear any previous errors
      const response = await orderService.getUserOrders({
        page: currentPage,
        limit: itemsPerPage
      });
      
      if (!response || !Array.isArray(response.orders)) {
        throw new Error('Invalid response format');
      }

      setOrders(response.orders);
      setTotalOrders(response.totalOrders || 0);
      setTotalPages(response.totalPages || 1);
      
      if (currentPage > (response.totalPages || 1)) {
        setCurrentPage(1);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getStatusStyle = (status) => {
    const baseClasses = "relative inline-block px-3 py-1 font-semibold leading-tight rounded-full capitalize";
    switch (status?.toLowerCase()) {
      case 'delivered':
        return `${baseClasses} text-green-900 bg-green-200`;
      case 'cancelled':
        return `${baseClasses} text-red-900 bg-red-200`;
      case 'processing':
        return `${baseClasses} text-blue-900 bg-blue-200`;
      case 'pending':
        return `${baseClasses} text-yellow-900 bg-yellow-200`;
      default:
        return `${baseClasses} text-gray-900 bg-gray-200`;
    }
  };

  const PaginationInfo = () => (
    <div className="text-sm text-gray-600 mt-4">
      Showing {Math.min((currentPage - 1) * itemsPerPage + orders.length, totalOrders)} of {totalOrders} orders
    </div>
  );

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 mx-1 rounded transition-colors duration-200 ${
            currentPage === i
              ? 'bg-blue-600 text-white'
              : 'bg-white text-blue-600 hover:bg-blue-100 border border-blue-600'
          }`}
          aria-current={currentPage === i ? 'page' : undefined}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-center space-x-2 my-4">
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded bg-white text-blue-600 hover:bg-blue-100 disabled:opacity-50 disabled:hover:bg-white border border-blue-600 transition-colors duration-200"
        >
          First
        </button>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded bg-white text-blue-600 hover:bg-blue-100 disabled:opacity-50 disabled:hover:bg-white border border-blue-600 transition-colors duration-200"
        >
          Previous
        </button>
        {startPage > 1 && <span className="px-2">...</span>}
        {pages}
        {endPage < totalPages && <span className="px-2">...</span>}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded bg-white text-blue-600 hover:bg-blue-100 disabled:opacity-50 disabled:hover:bg-white border border-blue-600 transition-colors duration-200"
        >
          Next
        </button>
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded bg-white text-blue-600 hover:bg-blue-100 disabled:opacity-50 disabled:hover:bg-white border border-blue-600 transition-colors duration-200"
        >
          Last
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error! </strong>
        <span className="block sm:inline">{error}</span>
        <button 
          onClick={fetchOrders}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-8">
      <div className="py-8">
        <div className="flex flex-col md:flex-row justify-between w-full mb-1 sm:mb-0">
          <h2 className="text-2xl leading-tight font-bold text-gray-900">Order History</h2>
          <div className="text-end">
            <button 
              onClick={fetchOrders}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 transition-colors duration-200"
            >
              Refresh Orders
            </button>
          </div>
        </div>
        <div className="py-4 overflow-x-auto">
          <div className="inline-block min-w-full shadow rounded-lg overflow-hidden">
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">{order.orderId || 'N/A'}</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">
                        ₹{(order.originalAmount || 0).toFixed(2)}
                      </p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap capitalize">
                        {order.paymentMethod || 'N/A'}
                      </p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <span className={getStatusStyle(order.orderStatus)}>
                        {order.orderStatus || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <Link 
                        to={`/user/orders/${order._id}`}
                        className="text-blue-600 hover:text-blue-900 hover:underline transition-colors duration-200"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="px-5 py-10 bg-white text-center">
                <p className="text-gray-500 text-lg">No orders found.</p>
                <Link 
                  to="/user/shop"
                  className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  Start Shopping
                </Link>
              </div>
            )}
          </div>
          <PaginationInfo />
          <PaginationControls />
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;