import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../../api/axiosConfig';

const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

function AdminOrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/orders?page=${currentPage}&limit=${ordersPerPage}`);
      setOrders(response.data.orders);
      setTotalOrders(response.data.totalOrders);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch orders. Please try again.');
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
        console.log('Sending request with:', {
            orderId,
            newStatus,
            requestBody: { orderStatus: newStatus }
        });
        
        const response = await axiosInstance.put(`/admin/orders/${orderId}/status`, { 
            orderStatus: newStatus 
        });
        
        console.log('Response received:', response.data);
        
        setOrders(orders.map(order => 
            order._id === orderId ? { ...order, orderStatus: newStatus } : order
        ));
    } catch (err) {
        console.error('Full error object:', err);
        console.error('Error response data:', err.response?.data);
        console.error('Error status:', err.response?.status);
        setError(err.response?.data?.message || 'Failed to update order status');
        setTimeout(() => setError(null), 3000);
    }
};

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <div className="text-center py-8">Loading orders...</div>;

  return (
    <div className="container mx-auto px-4 sm:px-8">
      <div className="py-8">
        <h1 className="text-3xl font-semibold mb-6">Admin Order Management</h1>
        {error && <div className="text-center py-2 text-red-600 mb-4">{error}</div>}
        <div className="shadow overflow-hidden rounded-lg border-b border-gray-200">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Order ID</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Customer</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Date</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Total</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Status</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="text-left py-3 px-4">#{order._id}</td>
                  <td className="text-left py-3 px-4">{order.user.user_name}</td>
                  <td className="text-left py-3 px-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="text-left py-3 px-4">₹{order.originalAmount.toFixed(2)}</td>
                  <td className="text-left py-3 px-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                      order.orderStatus === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                      order.orderStatus === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                      order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="text-left py-3 px-4">
                    <select 
                      className="block w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                      value={order.orderStatus}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          ordersPerPage={ordersPerPage}
          totalOrders={totalOrders}
          paginate={paginate}
          currentPage={currentPage}
        />
      </div>
    </div>
  );
}

function Pagination({ ordersPerPage, totalOrders, paginate, currentPage }) {
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalOrders / ordersPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="flex justify-center mt-4">
      <ul className="flex">
        {pageNumbers.map(number => (
          <li key={number} className="mx-1">
            <button
              onClick={() => paginate(number)}
              className={`px-4 py-2 border rounded ${
                currentPage === number ? 'bg-blue-500 text-white' : 'bg-white text-blue-500'
              }`}
            >
              {number}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default AdminOrderList;

