import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { axiosInstance } from "../../api/axiosConfig"
import { handleApproveReturn, handleProcessRefund, getReturnStatus } from "../../api/returnService/returnService"
import { toast } from "sonner"

function OrderDetails() {
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processingItems, setProcessingItems] = useState(new Set())
  const { orderId } = useParams()
  const navigate = useNavigate()

  const statusOptions = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]

  useEffect(() => {
    fetchOrderDetails()
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get(`/admin/orders/${orderId}/status`)
      setOrder(response.data.order || response.data.data)
      setError(null)
    } catch (err) {
      console.error("Error fetching order details:", err)
      setError("Failed to fetch order details")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    try {
      setLoading(true)
      const response = await axiosInstance.put(`/admin/orders/${order.orderId}/status`, {
        orderStatus: newStatus,
      })

      if (response.data.success) {
        await fetchOrderDetails()
        setError(null)
        toast.success('Order status updated successfully')
      } else {
        setError(response.data.message || "Update failed")
      }
    } catch (err) {
      console.error("Error updating status:", err)
      setError(err.response?.data?.message || "Failed to update status")
    } finally {
      setLoading(false)
    }
  }

  const handleReturnAction = async (itemId, approved) => {
    try {
      setProcessingItems(prev => new Set([...prev, itemId]))
      
      const response = await handleApproveReturn({
        orderId: order.orderId,
        itemId: itemId,
        approved,
      })
  
      if (response && response.success) {
        await fetchOrderDetails()
        toast.success(approved ? 'Return approved' : 'Return rejected')
      } else {
        throw new Error(response?.error || response?.message || 'Return action failed')
      }
      
    } catch (err) {
      console.error("Return action error:", err)
      toast.error(err.message || "Failed to process return request")
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "shipped":
        return "bg-indigo-100 text-indigo-800 border-indigo-200"
      case "delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "return_pending":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "returned":
        return "bg-red-100 text-red-800 border-red-200"
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 rounded-lg bg-white shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-center">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="p-8 rounded-lg bg-white shadow-lg text-center max-w-md w-full">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <button
            onClick={() => fetchOrderDetails()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="p-8 rounded-lg bg-white shadow-lg">
          <p className="text-xl text-gray-600">Order not found</p>
        </div>
      </div>
    )
  }

  const returnRequestedItems = order.items.filter(item => 
    item.itemStatus === 'Return_Pending' || 
    item.itemStatus === 'Returned'
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Order Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Order #{order.orderId}</h2>
              <p className="text-gray-500 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">Status:</span>
              <select
                className="bg-white border-2 border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                value={order.orderStatus || ""}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                disabled={loading}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm mb-8 overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">Order Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.items.map((item) => (
                  <tr key={item.product} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{item.productName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{item.size}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">₹{item.price}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(item.itemStatus)}`}>
                        {item.itemStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Return Requests Section */}
        {returnRequestedItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Return Requests</h3>
            <div className="space-y-6">
              {returnRequestedItems.map((item) => (
                <div key={item.product} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="space-y-2">
                      <h4 className="text-lg font-semibold text-gray-900">{item.productName}</h4>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>Size: {item.size}</span>
                        <span>Quantity: {item.quantity}</span>
                      </div>
                      {item.returnReason && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Return Reason: </span>
                          {item.returnReason}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Requested At: </span>
                        {new Date(item.returnRequestedAt).toLocaleString()}
                      </p>
                      {item.refundStatus !== 'none' && (
                        <p className="text-sm">
                          <span className="font-medium">Refund Status: </span>
                          <span className={`${getStatusColor(item.refundStatus)} px-2 py-1 rounded-full`}>
                            {item.refundStatus}
                          </span>
                        </p>
                      )}
                    </div>

                    {item.itemStatus === 'Return_Pending' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReturnAction(item.product, true)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                          disabled={processingItems.has(item.product)}
                        >
                          {processingItems.has(item.product) ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </span>
                          ) : 'Approve Return'}
                        </button>
                        <button
                          onClick={() => handleReturnAction(item.product, false)}
                          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                          disabled={processingItems.has(item.product)}
                        >
                          {processingItems.has(item.product) ? 'Processing...' : 'Reject Return'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderDetails