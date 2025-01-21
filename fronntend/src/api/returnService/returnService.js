// OrderDetail.js or wherever you're implementing the return functionality

// Request Return



import { axiosInstance } from "../../api/axiosConfig";
export const ReturnStatus = {
  PENDING: 'Return_Pending',    // Match backend status
  COMPLETE: 'Returned',         // Match backend status
  REJECTED: 'Delivered',        // Match backend status
  DELIVERED: 'Delivered'        // Match backend status
};

export const handleRequestReturn = async ({ orderId, itemId, reason }) => {
    try {
      const { data } = await axiosInstance.post(`/user/return/request`, {
        orderId,
        itemId,
        reason
      });
      return { success: true, data };
    } catch (error) {
      return {
        success: false, 
        error: error?.response?.data?.message || 'Failed to request return'
      };
    }
  };
  
  // Approve/Reject Return (Admin)
  export const handleApproveReturn = async ({ orderId, itemId, approved }) => {
    try {
      const response = await axiosInstance.post('/admin/return/approve', {
        orderId,
        itemId,
        approved
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error in handleApproveReturn:', error);
      return {
        success: false,
        error: error.message || 'Failed to process return request'
      };
    }
  };
  
  // Process Refund (Admin)
  export const handleProcessRefund = async ({ orderId, itemId }) => {
    try {
      // First update status to pending
      await axiosInstance.post(`/admin/return/status-update`, {
        orderId,
        itemId,
        status: ReturnStatus.REFUND_PENDING
      });
  
      // Process the refund
      const { data } = await axiosInstance.post(`/admin/return/refund`, {
        orderId,
        itemId
      });
  
      // Update status based on refund result
      await axiosInstance.post(`/admin/return/status-update`, {
        orderId,
        itemId,
        status: ReturnStatus.REFUND_COMPLETED
      });
  
      return { success: true, data };
    } catch (error) {
      // Update status to failed if refund fails
      try {
        await axiosInstance.post(`/admin/return/status-update`, {
          orderId,
          itemId,
          status: ReturnStatus.REFUND_FAILED
        });
      } catch (statusError) {
        console.error('Failed to update refund status:', statusError);
      }
  
      return {
        success: false,
        error: error?.response?.data?.message || 'Failed to process refund'
      };
    }
  };
  
  
  // Get Return Status
  export const getReturnStatus = async ({ orderId, itemId }) => {
    try {
      const response = await axiosInstance.get(`/admin/return/status/${orderId}/${itemId}`);
      return {
        success: true,
        data: response.data.data // Note: Backend returns nested data object
      };
    } catch (error) {
      console.error('Error in getReturnStatus:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch return status'
      };
    }
  };