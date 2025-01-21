const Order = require('../model/orderSchema');
const User =require("../model/userModel")
const {addRefundToWallet} = require("../controller/walletController")
// Request a return for an order item
const requestReturn = async (req, res) => {
    try {
      const { orderId, itemId, reason } = req.body;
      const userId = req.user.data.id;
  
      console.log('Attempting to find order with:', {
        searchOrderId: orderId,
        searchUserId: userId
      });
  
      if (!orderId || !itemId || !reason) {
        return res.status(400).json({
          message: 'Missing required fields',
          required: ['orderId', 'itemId', 'reason'],
          received: { orderId, itemId, reason }
        });
      }
  
      // Validate orderId format
      if (!orderId.startsWith('ORD')) {
        return res.status(400).json({
          message: 'Invalid order ID format',
          expectedFormat: 'ORD + timestamp + random number',
          receivedId: orderId
        });
      }
  
      // Find the order without user filter first to debug
      const order = await Order.findOne({ orderId: orderId });
      
      console.log('Order search result:', order ? 'Found' : 'Not Found');
  
      if (!order) {
        // Query the database to see if we can find any orders
        const sampleOrders = await Order.find().limit(1);
        return res.status(404).json({
          message: 'Order not found',
          searchedOrderId: orderId,
          orderIdFormat: sampleOrders.length > 0 ? sampleOrders[0].orderId : null,
          debug: {
            orderIdType: typeof orderId,
            orderIdLength: orderId.length,
            hasOrders: sampleOrders.length > 0
          }
        });
      }
  
      // Verify user ownership
      if (order.user.toString() !== userId.toString()) {
        return res.status(403).json({
          message: 'Unauthorized - Order does not belong to this user'
        });
      }
  
      // Find the specific item
      const orderItem = order.items.find(item => item.product.toString() === itemId);
      
      if (!orderItem) {
        return res.status(404).json({
          message: 'Order item not found',
          availableItems: order.items.map(item => item.product.toString())
        });
      }
  
      // Validate item status
      if (orderItem.itemStatus !== 'Delivered') {
        return res.status(400).json({
          message: 'Item is not eligible for return',
          currentStatus: orderItem.itemStatus,
          requiredStatus: 'Delivered'
        });
      }
  
      // Update item status
      orderItem.itemStatus = 'Return_Pending';
      orderItem.returnReason = reason;
      orderItem.returnRequestedAt = new Date();
  
      await order.save();
  
      return res.status(200).json({
        message: 'Return request submitted successfully',
        returnDetails: {
          orderId: order.orderId,
          itemId: orderItem.product,
          status: orderItem.itemStatus,
          reason: orderItem.returnReason,
          requestedAt: orderItem.returnRequestedAt
        }
      });
    } catch (error) {
      console.error('Error in requestReturn:', error);
      return res.status(500).json({
        message: 'Internal server error while processing return request',
        error: error.message
      });
    }
  };

// Admin approve return request
const approveReturn = async (req, res) => {
  try {
    const { orderId, itemId, approved } = req.body;

    const order = await Order.findOne({ orderId: orderId });
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    const orderItem = order.items.find(item => item.product.toString() === itemId);
    if (!orderItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order item not found' 
      });
    }

    if (approved) {
      // Calculate correct refund amount based on discounted price and quantity
      const refundAmount = orderItem.discountedPrice * orderItem.quantity;
      
      try {
        const updateWallet = await addRefundToWallet(
          order.user,
          refundAmount,
          orderId
        );

        orderItem.itemStatus = 'Returned';
        orderItem.refundStatus = 'processed';
        orderItem.refundAmount = refundAmount;
        orderItem.refundDate = new Date();

        // Update total refund amount for the order
        order.totalRefundAmount += refundAmount;

        // Add refund history entry with correct amount
        order.refundHistory.push({
          amount: refundAmount,
          date: new Date(),
          status: 'processed',
          itemId: itemId,
          reason: orderItem.returnReason
        });

        await order.save(); // Save the order after approval
      } catch (walletError) {
        console.error("wallet transaction error", walletError);
        return res.status(400).json({
          success: false,
          message: "error processing wallet refund",
          error: walletError.message
        });
      }
    } else {
      // Reject return request
      orderItem.itemStatus = 'Delivered';
      orderItem.refundStatus = 'failed';
      await order.save();
    }

    return res.status(200).json({
      success: true,
      message: `Return request ${approved ? 'approved' : 'rejected'} successfully`,
      data: {
        orderItem: orderItem,
        refundAmount: approved ? orderItem.refundAmount : 0,
        quantity: orderItem.quantity
      }
    });

  } catch (error) {
    console.error('Error in approveReturn:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error processing return approval',
      error: error.message 
    });
  }
};

const processRefund = async (req, res) => {
  try {
    const { orderId, itemId } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const orderItem = order.items.find(item => item.product.toString() === itemId);
    if (!orderItem) {
      return res.status(404).json({ message: 'Order item not found' });
    }

    if (orderItem.itemStatus !== 'Returned' || orderItem.refundStatus !== 'pending') {
      return res.status(400).json({ 
        message: 'Item is not eligible for refund processing' 
      });
    }

    // Calculate refund amount based on discounted price and quantity
    const refundAmount = orderItem.discountedPrice * orderItem.quantity;

    try {
      // Razorpay refund integration
      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_SECRET
      });

      const refund = await instance.payments.refund(order.razorpayPaymentId, {
        amount: refundAmount * 100, // Convert to paise
        notes: {
          orderId: order.orderId,
          itemId: itemId,
          reason: orderItem.returnReason,
          quantity: orderItem.quantity
        }
      });

      // Update refund status
      orderItem.refundStatus = 'processed';
      orderItem.refundDate = new Date();
      orderItem.refundAmount = refundAmount;

      // Update refund history
      const refundRecord = order.refundHistory.find(
        record => record.itemId.toString() === itemId
      );
      if (refundRecord) {
        refundRecord.status = 'processed';
        refundRecord.amount = refundAmount;
      }

      // Update total refund amount for the order
      order.totalRefundAmount = order.refundHistory.reduce((total, record) => {
        return record.status === 'processed' ? total + record.amount : total;
      }, 0);

      await order.save();

      return res.status(200).json({
        message: 'Refund processed successfully',
        orderItem,
        refundDetails: {
          ...refund,
          quantity: orderItem.quantity,
          unitPrice: orderItem.discountedPrice,
          totalRefundAmount: refundAmount
        }
      });
    } catch (paymentError) {
      console.error('Payment gateway error:', paymentError);
      
      // Update refund status to failed
      orderItem.refundStatus = 'failed';
      const refundRecord = order.refundHistory.find(
        record => record.itemId.toString() === itemId
      );
      if (refundRecord) {
        refundRecord.status = 'failed';
      }
      
      await order.save();

      return res.status(400).json({
        message: 'Payment gateway refund failed',
        error: paymentError.message
      });
    }
  } catch (error) {
    console.error('Error in processRefund:', error);
    return res.status(500).json({ 
      message: 'Error processing refund' 
    });
  }
};

// Get return status
const getReturnStatus = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;

        // Get order with populated product details
        const order = await Order.findOne({ orderId })
            .populate('user')
            .populate('items.product');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
                data: {
                    orderId,
                    searchedOrderId: orderId
                }
            });
        }

        // Find the specific item in the order
        const orderItem = order.items.find(item => 
            item.product._id.toString() === itemId || 
            item.product.toString() === itemId
        );

        if (!orderItem) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in order',
                data: {
                    availableItems: order.items.map(item => ({
                        productId: item.product._id || item.product,
                        itemStatus: item.itemStatus
                    }))
                }
            });
        }

        // Check item eligibility for return
        const isEligibleForReturn = orderItem.itemStatus === 'Delivered' || 
                                  orderItem.itemStatus === 'Return_Pending';

        // Prepare return status data
        const returnStatus = {
            orderId: order.orderId,
            productDetails: {
                productId: orderItem.product._id || orderItem.product,
                productName: orderItem.productName,
                size: orderItem.size,
                quantity: orderItem.quantity
            },
            returnDetails: {
                itemStatus: orderItem.itemStatus,
                isEligibleForReturn,
                returnReason: orderItem.returnReason || null,
                returnRequestedAt: orderItem.returnRequestedAt || null,
                returnApprovedAt: orderItem.returnApprovedAt || null
            },
            refundDetails: {
                refundStatus: orderItem.refundStatus,
                refundAmount: orderItem.refundAmount || 0,
                refundDate: orderItem.refundDate || null
            }
        };

        return res.status(200).json({
            success: true,
            message: 'Return status retrieved successfully',
            data: returnStatus
        });

    } catch (error) {
        console.error('Error in getReturnStatus:', {
            error: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            success: false,
            message: 'Error retrieving return status',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
const isReturnEligible = (orderItem) => {
    if (!orderItem) return false;

    // Add your business logic for return eligibility
    const eligibleStatuses = ['Delivered', 'Return_Pending'];
    return eligibleStatuses.includes(orderItem.itemStatus);
};

module.exports = {
  requestReturn,
  approveReturn,
  processRefund,
  getReturnStatus
};