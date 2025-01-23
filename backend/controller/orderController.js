const Order = require('../model/orderSchema');
const Cart = require('../model/cartSchema');
const ProductSchema = require('../model/productSchema');
const { validateCoupon, markCouponAsUsed } = require('../controller/couponController')
const Coupon = require("../model/couponSchema")
const Wallet= require("../model/walletSchema")
// Create a new order from cart
const dotenv = require("dotenv")
dotenv.config();
const Razorpay = require("razorpay")
const crypto = require("crypto");
const { useWalletBalance } = require('./walletController');
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});
const createOrder = async (req, res) => {
    try {
        const { shippingAddressId, paymentMethod, orderNotes, appliedCouponId } = req.body;
        const userId = req.user.data.id;

        // Get user's cart with populated product details
        const cart = await Cart.findOne({ user: userId })
            .populate({
                path: "items.product",
                populate: {
                    path: "category"
                }
            });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Validate product and category availability
        for (const item of cart.items) {
            const product = item.product;
            if (!product.isactive) {
                return res.status(400).json({
                    success: false,
                    message: `Product "${product.productName}" is currently unavailable`
                });
            }
            if (!product.category.isactive) {
                return res.status(400).json({
                    success: false,
                    message: `Category "${product.category.CategoryName}" is currently unavailable`
                });
            }
        }

        // Verify stock availability
        const stockUpdates = [];
        for (const item of cart.items) {
            const product = await ProductSchema.findById(item.product._id);
            const sizeIndex = product.availableSizes.findIndex(s => s.size === item.size);

            if (sizeIndex === -1 || product.availableSizes[sizeIndex].quantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `${product.productName} is out of stock in size ${item.size}`
                });
            }

            stockUpdates.push({
                productId: product._id,
                sizeIndex,
                quantity: item.quantity,
                currentQuantity: product.availableSizes[sizeIndex].quantity
            });
        }

        let originalAmount = cart.totalAmount;
        let currentAmount = cart.totalAmount;
        let appliedCoupon = null;

        // Handle coupon if applied
        if (appliedCouponId) {
            try {
                const coupon = await Coupon.findById(appliedCouponId);
                if (!coupon) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid coupon'
                    });
                }

                const { discountAmount, finalAmount: discountedAmount } = await validateCoupon(
                    coupon.code,
                    cart.totalAmount,
                    userId,
                    appliedCouponId
                );

                currentAmount = discountedAmount;
                appliedCoupon = {
                    couponId: appliedCouponId,
                    discountAmount
                };
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: `Coupon error: ${error.message}`
                });
            }
        }

        // Create order instance with proper price mapping
        const order = new Order({
            user: userId,
            items: cart.items.map(item => {
                // Get the appropriate price (sale price if available, otherwise regular price)
                const basePrice = item.product.salePrice || item.product.regularPrice;
                let discountedPrice = basePrice;

                // Apply coupon discount if available
                if (appliedCoupon) {
                    const discountRatio = appliedCoupon.discountAmount / originalAmount;
                    discountedPrice = basePrice * (1 - discountRatio);
                }

                return {
                    product: item.product._id,
                    quantity: item.quantity,
                    size: item.size,
                    price: item.product.regularPrice, // Original regular price
                    discountedPrice: discountedPrice // Final price after all discounts
                };
            }),
            shippingAddress: shippingAddressId,
            originalAmount,
            initialTotalAmount: originalAmount,
            currentAmount,
            paymentMethod,
            orderNotes,
            couponApplied: appliedCoupon,
            estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        // Handle Razorpay order creation
        let razorpayOrderData = null;
        if (paymentMethod === 'razorpay') {
            try {
                const amountInPaise = Math.round(currentAmount * 100);

                const timestamp = Date.now().toString().slice(-8);
                const randomStr = Math.random().toString(36).substring(2, 6);
                const receipt = `ord_${timestamp}${randomStr}`;

                const razorpayOrder = await razorpay.orders.create({
                    amount: amountInPaise,
                    currency: 'INR',
                    receipt: receipt,
                    notes: {
                        orderId: order._id.toString()
                    }
                });

                order.razorpayOrderId = razorpayOrder.id;
                order.paymentStatus = 'pending';
                razorpayOrderData = {
                    id: razorpayOrder.id,
                    amount: amountInPaise,
                    currency: 'INR',
                    receipt: receipt
                };
            } catch (error) {
                console.error('Razorpay order creation error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error creating Razorpay order',
                    error: error.message
                });
            }
        }

        if(paymentMethod==="wallet"){
           try{
            const walletResponse = await useWalletBalance({
                user: { data: { id: userId } },
                body: {
                    amount: currentAmount,
                    orderId: order._id
                }
            });

            if (!walletResponse.success) {
                return res.status(400).json({
                    success: false,
                    message: walletResponse.message || 'Wallet payment failed'
                });
            }

            order.paymentStatus = 'completed';
            order.orderStatus = 'Pending';
           }
           catch(error){
            return res.status(400).json({
                success:false,
                message:"wallet payment failed:" +error.message
            })
           }
        }

        // Save order
        await order.save();

        // Update stock levels
        for (const update of stockUpdates) {
            const product = await ProductSchema.findById(update.productId);
            if (product.availableSizes[update.sizeIndex].quantity !== update.currentQuantity) {
                await Order.findByIdAndDelete(order._id);
                return res.status(400).json({
                    success: false,
                    message: 'Stock levels have changed. Please try again.'
                });
            }

            product.availableSizes[update.sizeIndex].quantity -= update.quantity;
            const totalRemainingStock = product.availableSizes.reduce(
                (total, size) => total + size.quantity,
                0
            );
            product.status = totalRemainingStock > 0 ? 'active' : 'outOfStock';
            await product.save();
        }

        // Mark coupon as used if applied
        if (appliedCoupon) {
            await markCouponAsUsed(appliedCouponId, userId);
        }

        // Clear cart
        await Cart.findByIdAndUpdate(cart._id, {
            $set: { items: [], totalAmount: 0 }
        });

        // Prepare response
        const responseData = {
            success: true,
            message: 'Order created successfully',
            data: {
                orderId: order._id,
                items: order.items,
                shippingAddress: order.shippingAddress,
                originalAmount: order.originalAmount,
                currentAmount: order.currentAmount,
                paymentMethod: order.paymentMethod,
                orderStatus: order.orderStatus,
                paymentStatus: order.paymentStatus
            }
        };

        if (razorpayOrderData) {
            responseData.razorpayOrder = razorpayOrderData;
        }

        return res.status(200).json(responseData);

    } catch (error) {
        console.error('Order creation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    }
};


// Get all orders for a user
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.data.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const totalOrders = await Order.countDocuments({ user: userId });

        // Get paginated orders
        const orders = await Order.find({ user: userId })
            .populate('items.product')
            .populate('shippingAddress')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            orders,
            totalOrders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit)
        });
    } catch (error) {
        console.error('Error in getUserOrders:', error);
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
};

// Get single order details
const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.data.id;

        const order = await Order.findOne({
            _id: orderId,
            user: userId
        })
            .populate('items.product')
            .populate('shippingAddress');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const orderSummary = {
            orderId: order.orderId,
            orderStatus: order.orderStatus,
            originalAmount: order.originalAmount,
            initialTotalAmount: order.initialTotalAmount,
            currentAmount: order.currentAmount,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt,
            shippingAddress: order.shippingAddress, 
            items: order.items.map(item => ({
                product: item.product._id,
                productName: item.product.productName,
                originalPrice: item.originalPrice,
                currentPrice: item.currentPrice,
                quantity: item.quantity,
                size: item.size,
                price: item.price,
                discountedPrice: item.discountedPrice,
                itemStatus: item.itemStatus,
                cancelReason: item.cancelReason || null,
                cancelledAt: item.cancelledAt || null,
                refundStatus: item.refundStatus,
                refundAmount: item.refundAmount || 0,
                refundDate: item.refundDate || null
            })),
            totalRefundAmount: order.totalRefundAmount || 0,
            refundHistory: order.refundHistory || [],
            cancelReason: order.cancelReason || null,
            couponApplied: order.couponApplied || null
        };
        res.status(200).json({ order: orderSummary });
    } catch (error) {
        console.error('Detailed error:', error);
        res.status(500).json({ message: 'Error fetching order details', error: error.message });
    }
};



const getAdminOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log("orderId:",orderId)
        const userId = req.user.data.id;
        console.log("userId",userId)
        const order = await Order.findOne({
            _id: orderId
        })
            .populate('items.product')
            .populate('shippingAddress');
            console.log("hhjjjj",order)
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const orderSummary = {
            orderId: order.orderId,
            orderStatus: order.orderStatus,
            originalAmount: order.originalAmount,
            initialTotalAmount: order.initialTotalAmount,
            currentAmount: order.currentAmount,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt,
            items: order.items.map(item => ({
                product: item.product._id,
                productName: item.product.productName,
                originalPrice: item.originalPrice,
                currentPrice: item.currentPrice,
                quantity: item.quantity,
                size: item.size,
                price: item.price,
                itemStatus: item.itemStatus,
                cancelReason: item.cancelReason || null,
                cancelledAt: item.cancelledAt || null,
                refundStatus: item.refundStatus,
                refundAmount: item.refundAmount || 0,
                refundDate: item.refundDate || null,
                returnRequestedAt:item.returnRequestedAt||null,
                returnApprovedAt:item.returnApprovedAt|| null
            })),
            totalRefundAmount: order.totalRefundAmount || 0,
            refundHistory: order.refundHistory || [],
            cancelReason: order.cancelReason || null,
            couponApplied: order.couponApplied || null
        };
        res.status(200).json({ order: orderSummary });
    } catch (error) {
        console.error('Detailed error:', error);
        res.status(500).json({ message: 'Error fetching order details', error: error.message });
    }
};
// Cancel order
const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { cancelReason } = req.body;
        const userId = req.user.data.id;
 
        const order = await Order.findOne({ _id: orderId, user: userId });
 
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
 
        // Validate cancellation is possible
        if (!['Pending', 'Processing'].includes(order.orderStatus)) {
            return res.status(400).json({
                message: 'Order cannot be cancelled in current status'
            });
        }
 
        // Calculate total amount of already refunded items
        const refundedItems = order.items.filter(item => 
            item.itemStatus === 'Cancelled' && 
            (item.refundStatus === 'completed' || item.refundStatus === 'processed')
        );
 
        const refundedItemsTotal = refundedItems.reduce((total, item) => 
            total + (item.discountedPrice || item.price) * item.quantity, 
        0);
 
        // Calculate remaining refundable amount
        const refundAmount = order.originalAmount - refundedItemsTotal;
 
        if (refundAmount <= 0) {
            return res.status(400).json({ 
                message: 'Order has already been fully refunded' 
            });
        }
 
        // Mark entire order as cancelled
        order.orderStatus = 'Cancelled';
        order.cancelReason = cancelReason;
        order.currentAmount = 0;
 
        // Mark remaining items as cancelled
        order.items.forEach(item => {
            if (item.itemStatus !== 'Cancelled') {
                item.itemStatus = 'Cancelled';
                item.cancelledAt = new Date();
                item.cancelReason = cancelReason;
                item.currentPrice = 0;
                item.refundStatus = 'processed';
                item.refundAmount = (item.discountedPrice || item.price) * item.quantity;
            }
        });
 
        // Refund processing
        if (order.paymentStatus === 'completed') {
            if (['wallet', 'razorpay'].includes(order.paymentMethod)) {
                const wallet = await Wallet.findOne({ user: userId });
                
                if (wallet) {
                    wallet.transactions.push({
                        amount: refundAmount,
                        type: 'credit',
                        orderId: order.orderId,
                        description: 'Remaining order refund',
                        status: 'completed'
                    });
                    
                    wallet.balance += refundAmount;
                    await wallet.save();
 
                    // Update total refund amount
                    order.totalRefundAmount += refundAmount;
                    order.paymentStatus = 'refunded';
                }
            } else {
                // For other payment methods
                order.refundHistory.push({
                    amount: refundAmount,
                    date: new Date(),
                    reason: cancelReason,
                    status: 'pending',
                    itemId: null // Full order refund
                });
            }
        }
 
        // Stock restoration for remaining items
        const remainingItemsToRestore = order.items.filter(item => 
            item.itemStatus !== 'Cancelled'
        );
 
        await Promise.all(remainingItemsToRestore.map(async (item) => {
            const product = await ProductSchema.findById(item.product);
            const sizeIndex = product.availableSizes.findIndex(s => s.size === item.size);
 
            if (sizeIndex !== -1) {
                product.availableSizes[sizeIndex].quantity += item.quantity;
                const totalStock = product.availableSizes.reduce((sum, size) => sum + size.quantity, 0);
                product.status = totalStock > 0 ? 'active' : 'outOfStock';
                await product.save();
            }
        }));
 
        await order.save();
 
        res.status(200).json({
            message: 'Order cancelled successfully',
            order: {
                orderId: order.orderId,
                originalAmount: order.originalAmount,
                refundedItemsTotal,
                currentAmount: order.currentAmount,
                totalRefundAmount: order.totalRefundAmount,
                orderStatus: order.orderStatus,
                paymentStatus: order.paymentStatus
            }
        });
    } catch (error) {
        console.error('Error in cancelOrder:', error);
        res.status(500).json({ 
            message: 'Error cancelling order', 
            error: error.message 
        });
    }
 };
const cancelOrderItem = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const { cancelReason } = req.body;
        const userId = req.user.data.id;

        const order = await Order.findOne({
            _id: orderId,
            user: userId
        }).populate('items.product');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Find the specific item
        const orderItem = order.items.find(item => item.product._id.toString() === itemId);
        if (!orderItem) {
            return res.status(404).json({ message: 'Item not found in order' });
        }

        // Check if item is already cancelled
        if (orderItem.itemStatus === 'Cancelled') {
            return res.status(400).json({
                message: 'Item is already cancelled'
            });
        }

        // Check if cancellation is allowed based on order status
        if (!['Pending', 'Processing'].includes(order.orderStatus)) {
            return res.status(400).json({
                message: 'Order items cannot be cancelled in current status'
            });
        }

        // Cancel the specific item
        orderItem.itemStatus = 'Cancelled';
        orderItem.cancelReason = cancelReason;
        orderItem.cancelledAt = new Date();
        orderItem.currentPrice = 0; // Set current price to 0 for cancelled item

        // Restore product quantity
        const product = await ProductSchema.findById(orderItem.product);
        const sizeIndex = product.availableSizes.findIndex(s => s.size === orderItem.size);
        
        if (sizeIndex !== -1) {
            product.availableSizes[sizeIndex].quantity += orderItem.quantity;
            const totalStock = product.availableSizes.reduce((sum, size) => sum + size.quantity, 0);
            product.status = totalStock > 0 ? 'active' : 'outOfStock';
            await product.save();
        }

        // Count active items after cancellation
        const activeItems = order.items.filter(item => item.itemStatus !== 'Cancelled');
        
        // Calculate new current amount based on remaining active items
        const previousAmount = order.currentAmount;
        order.currentAmount = activeItems.reduce((sum, item) => {
            const itemPrice = item.discountedPrice || item.price;
            return sum + (itemPrice * item.quantity);
        }, 0);

        // Update order status ONLY if all items are cancelled
        if (activeItems.length === 0) {
            order.orderStatus = 'Cancelled';
        }

        // Handle refund if payment was already made
        if (order.paymentStatus === 'completed') {
            const refundAmount = orderItem.discountedPrice || orderItem.price;
            const refundTotal = refundAmount * orderItem.quantity;

            // Wallet and Razorpay payment refund handling
            if (['wallet', 'razorpay'].includes(order.paymentMethod)) {
                const wallet = await Wallet.findOne({ user: userId });
                if (wallet) {
                    wallet.transactions.push({
                        amount: refundTotal,
                        type: 'credit',
                        orderId: order.orderId,
                        description: `Refund for cancelled item ${itemId}`,
                        status: 'completed'
                    });
                    wallet.balance += refundTotal;
                    await wallet.save();

                    orderItem.refundStatus = 'completed';
                    orderItem.refundAmount = refundTotal;
                    orderItem.refundDate = new Date();
                } else {
                    // Fallback if wallet not found
                    orderItem.refundStatus = 'failed';
                }
            } else {
                // For other payment methods
                const refundEntry = {
                    amount: refundTotal,
                    date: new Date(),
                    reason: cancelReason,
                    status: 'pending',
                    itemId: itemId
                };
                
                order.refundHistory.push(refundEntry);
                order.totalRefundAmount = (order.totalRefundAmount || 0) + refundTotal;
                orderItem.refundStatus = 'pending';
                orderItem.refundAmount = refundTotal;
            }
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Item cancelled successfully',
            order: {
                orderId: order.orderId,
                orderStatus: order.orderStatus,
                originalAmount: order.originalAmount,
                currentAmount: order.currentAmount,
                totalRefundAmount: order.totalRefundAmount,
                paymentStatus: order.paymentStatus,
                items: order.items.map(item => ({
                    product: item.product._id || item.product,
                    productName: item.productName,
                    quantity: item.quantity,
                    size: item.size,
                    originalPrice: item.price,
                    currentPrice: item.currentPrice,
                    itemStatus: item.itemStatus,
                    cancelReason: item.cancelReason,
                    cancelledAt: item.cancelledAt,
                    refundStatus: item.refundStatus,
                    refundAmount: item.refundAmount,
                    discountedPrice: item.discountedPrice,
                    price: item.price
                }))
            }
        });
    } catch (error) {
        console.error('Error in cancelOrderItem:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing item cancellation',
            error: error.message
        });
    }
};
//---------------// Update order status (admin only)
const getAllOrderByAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalOrders = await Order.countDocuments();
        const orders = await Order.find({})
            .populate('user', 'user_name email')
            .populate('items.product')
            .populate('shippingAddress')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            orders,
            totalOrders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit)
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching orders',
            error: error.message
        });
    }
};


// Define the simplified order status chain
// Define the status values exactly as used in the frontend
const ORDER_STATUS = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled'  // Added cancelled status
};

// Define valid status transitions using the correct case
const VALID_ORDER_STATUSES = {
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.DELIVERED]: [], // Terminal state
    [ORDER_STATUS.CANCELLED]: []  // Terminal state
};

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { orderStatus } = req.body;

        // Validate if the status is valid (case-sensitive)
        if (!Object.values(ORDER_STATUS).includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status: ${orderStatus}`
            });
        }

        const order = await Order.findOne({ orderId })
            .populate('items.product', 'productName');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Validate order status transition
        const validNextStatuses = VALID_ORDER_STATUSES[order.orderStatus] || [];
        if (!validNextStatuses.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                message: `Invalid order status transition from ${order.orderStatus} to ${orderStatus}`
            });
        }

        // Update order status
        order.orderStatus = orderStatus;
        
        // Only update status of non-cancelled items
        order.items.forEach(item => {
            if (item.itemStatus !== ORDER_STATUS.CANCELLED) {
                item.itemStatus = orderStatus;
            }
        });

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: {
                orderId: order.orderId,
                orderStatus: order.orderStatus,
                items: order.items.map(item => ({
                    productName: item.product?.productName,
                    itemStatus: item.itemStatus
                }))
            }
        });

    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order status'
        });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing payment verification parameters'
            });
        }

        // Find order
        const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Verify signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }

        // Verify payment status with Razorpay
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        if (payment.status !== 'captured') {
            return res.status(400).json({
                success: false,
                message: 'Payment not captured'
            });
        }

        // Update order status
        order.paymentStatus = 'completed';
        order.razorpayPaymentId = razorpay_payment_id;
        order.razorpaySignature = razorpay_signature;
        await order.save();

        return res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            data: {
                orderId: order._id,
                paymentId: razorpay_payment_id,
                amount: order.currentAmount
            }
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verifying payment',
            error: error.message
        });
    }
};





module.exports = {

    createOrder,
    getUserOrders,
    cancelOrder,
    getOrderDetails,
    updateOrderStatus,
    getAllOrderByAdmin,
    cancelOrderItem,
    verifyPayment,
    getAdminOrderDetails
}