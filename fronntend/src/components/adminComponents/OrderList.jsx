import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import { axiosInstance } from '../../api/axiosConfig';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  const fetchOrders = async (page) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosInstance.get("/admin/orders", { params: { page, limit: 10 } });
      const ordersData = response.data;
      
      if (ordersData && Array.isArray(ordersData.orders)) {
        setOrders(ordersData.orders);
        setTotalPages(ordersData.totalPages || 1);
      } else {
        console.error('Invalid data format:', ordersData);
        setError('Invalid data format received');
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
        <div className="text-center py-10">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
        <div className="text-center py-10 text-red-500">
          Error: {error}
          <button 
            onClick={() => fetchOrders(currentPage)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
      {!orders || orders.length === 0 ? (
        <div className="text-center py-10">
          No orders found.
          <div className="mt-4">
            <button 
              onClick={() => fetchOrders(currentPage)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 text-left">Order ID</th>
                  <th className="py-2 px-4 text-left">Date</th>
                  <th className="py-2 px-4 text-left">Total</th>
                  <th className="py-2 px-4 text-left">Status</th>
                  <th className="py-2 px-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b">
                    <td className="py-2 px-4">{order._id}</td>
                    <td className="py-2 px-4">
                      {order.createdAt 
                        ? new Date(order.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="py-2 px-4">
                      {(order.currentAmount || 0).toFixed(2)}
                    </td>
                    <td className="py-2 px-4">{order.orderStatus || 'Unknown'}</td>
                    <td className="py-2 px-4">
                      <Link
                        to={`/admin/orders/${order._id}`}
                        className="text-blue-500 hover:underline flex items-center"
                      >
                        <FaEye className="mr-1" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`mx-1 px-3 py-1 rounded ${
                    currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderList;
