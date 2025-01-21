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
  
      // Check both success and data properties
      if (response && response.success) {
        await fetchOrderDetails() // Refresh order details
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
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "return_pending":
        return "bg-orange-100 text-orange-800"
      case "returned":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => fetchOrderDetails()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!order) {
    return <div className="text-center py-10">Order not found</div>
  }

  const returnRequestedItems = order.items.filter(item => 
    item.itemStatus === 'Return_Pending' || 
    item.itemStatus === 'Returned'
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Order Header */}
      <div className="mb-6 p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold">Order #{order.orderId}</h2>
        <div className="mt-2">
          <span className="font-medium">Order Status: </span>
          <select
            className="bg-white border border-gray-300 rounded px-3 py-2 ml-2"
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

      {/* Products Table */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Order Items</h3>
        <table className="min-w-full bg-white border rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.product} className="border-t">
                <td className="px-6 py-4">{item.productName}</td>
                <td className="px-6 py-4">{item.quantity}</td>
                <td className="px-6 py-4">{item.size}</td>
                <td className="px-6 py-4">₹{item.price}</td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2 py-1 rounded ${getStatusColor(item.itemStatus)}`}>
                    {item.itemStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Return Requests Section */}
      {returnRequestedItems.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Return Requests</h3>
          <div className="space-y-4">
            {returnRequestedItems.map((item) => (
              <div key={item.product} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{item.productName}</h4>
                    <p className="text-sm text-gray-600">
                      Size: {item.size} | Quantity: {item.quantity}
                    </p>
                    {item.returnReason && (
                      <p className="text-sm mt-2">
                        <span className="font-medium">Return Reason: </span>
                        {item.returnReason}
                      </p>
                    )}
                    <p className="text-sm mt-2">
                      <span className="font-medium">Requested At: </span>
                      {new Date(item.returnRequestedAt).toLocaleString()}
                    </p>
                    {item.refundStatus !== 'none' && (
                      <p className="text-sm mt-1">
                        <span className="font-medium">Refund Status: </span>
                        {item.refundStatus}
                      </p>
                    )}
                  </div>

                  {item.itemStatus === 'Return_Pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReturnAction(item.product, true)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
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
                        ) : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReturnAction(item.product, false)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        disabled={processingItems.has(item.product)}
                      >
                        {processingItems.has(item.product) ? 'Processing...' : 'Reject'}
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
  )
}

export default OrderDetails