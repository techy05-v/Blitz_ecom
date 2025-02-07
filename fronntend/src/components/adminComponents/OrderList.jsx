import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaSpinner, FaShoppingBag, FaSearch, FaFilter, FaCalendar, FaDownload, FaUndo } from 'react-icons/fa';
import { axiosInstance } from '../../api/axiosConfig';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  const fetchOrders = async (page) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get("/admin/orders", { 
        params: { page, limit: 10 } 
      });
      const ordersData = response.data;
      if (ordersData && Array.isArray(ordersData.orders)) {
        setOrders(ordersData.orders);
        setTotalPages(ordersData.totalPages || 1);
      } else {
        setError('Invalid data format received');
        setOrders([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const hasReturnItems = (order) => {
    return order.items?.some(item => 
      item.itemStatus === 'Return_Pending' || item.itemStatus === 'Returned'
    ) || false;
  };

  const getReturnItemsCount = (order) => {
    return order.items?.filter(item => 
      item.itemStatus === 'Return_Pending' || item.itemStatus === 'Returned'
    ).length || 0;
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Pending': 'bg-gradient-to-r from-yellow-200 to-yellow-100 text-yellow-800',
      'Processing': 'bg-gradient-to-r from-blue-200 to-blue-100 text-blue-800',
      'Shipped': 'bg-gradient-to-r from-purple-200 to-purple-100 text-purple-800',
      'Delivered': 'bg-gradient-to-r from-green-200 to-green-100 text-green-800',
      'Cancelled': 'bg-gradient-to-r from-red-200 to-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gradient-to-r from-gray-200 to-gray-100 text-gray-800';
  };

  const LoadingState = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="relative">
            <FaSpinner className="animate-spin text-5xl text-blue-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-50 to-transparent blur-lg"></div>
          </div>
          <p className="mt-4 text-lg text-gray-600 font-medium">Loading your orders...</p>
        </div>
      </div>
    </div>
  );

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white bg-opacity-90 backdrop-blur-lg p-8 rounded-2xl shadow-xl text-center">
            <div className="text-red-500 text-xl mb-4 font-medium">{error}</div>
            <button 
              onClick={() => fetchOrders(currentPage)}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white bg-opacity-90 backdrop-blur-lg rounded-2xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <FaShoppingBag className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  Your Orders
                </h1>
                <p className="text-gray-500">Manage and track your orders</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
              >
                <option>All Status</option>
                <option>Pending</option>
                <option>Processing</option>
                <option>Shipped</option>
                <option>Delivered</option>
                <option>Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders', value: orders.length, color: 'from-blue-500 to-blue-600' },
            { label: 'Pending', value: orders.filter(o => o.orderStatus === 'Pending').length, color: 'from-yellow-500 to-yellow-600' },
            { label: 'Delivered', value: orders.filter(o => o.orderStatus === 'Delivered').length, color: 'from-green-500 to-green-600' },
            { 
              label: 'Returns', 
              value: orders.filter(o => hasReturnItems(o)).length, 
              color: 'from-orange-500 to-orange-600' 
            },
          ].map((stat, index) => (
            <div key={index} className="bg-white bg-opacity-90 backdrop-blur-lg rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{stat.label}</span>
                <div className={`px-2 py-1 rounded-lg bg-gradient-to-r ${stat.color} text-white text-sm`}>
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Orders Table */}
        {!orders || orders.length === 0 ? (
          <div className="bg-white bg-opacity-90 backdrop-blur-lg rounded-2xl shadow-lg p-8 text-center">
            <FaShoppingBag className="text-gray-300 text-6xl mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-4">No orders found</p>
            <button 
              onClick={() => fetchOrders(currentPage)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Refresh Orders
            </button>
          </div>
        ) : (
          <div className="bg-white bg-opacity-90 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Order ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Total</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Returns</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => {
                    const returnCount = getReturnItemsCount(order);
                    const hasReturns = hasReturnItems(order);
                    
                    return (
                      <tr 
                        key={order._id}
                        className={`hover:bg-gray-50 transition-all duration-200 ${
                          hasReturns ? 'bg-orange-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {hasReturns && (
                              <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                              </span>
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {order.orderId || `#${order._id.slice(-6)}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <FaCalendar className="text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {order.createdAt 
                                ? new Date(order.createdAt).toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })
                                : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">
                            ₹{(order.currentAmount || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.orderStatus)}`}>
                            {order.orderStatus || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {hasReturns && (
                            <div className="flex items-center space-x-2">
                              <FaUndo className="text-orange-500" />
                              <span className="text-sm text-orange-600 font-medium">
                                {returnCount} {returnCount === 1 ? 'item' : 'items'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            to={`/admin/orders/${order._id}`}
                            className="inline-flex items-center px-4 py-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-all duration-200"
                          >
                            <FaEye className="mr-2" />
                            View Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Showing page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                          ${currentPage === i + 1 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }
                        `}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderList;