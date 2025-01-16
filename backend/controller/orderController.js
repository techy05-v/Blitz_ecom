const Order = require('../model/orderSchema');
const Cart = require('../model/cartSchema');
const ProductSchema = require('../model/productSchema');
const {validateCoupon , markCouponAsUsed } = require('../controller/couponController')
const Coupon = require("../model/couponSchema")
// Create a new order from cart
const dotenv= require("dotenv")
dotenv.config();
const Razorpay = require("razorpay")
const crypto = require("crypto")
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
            items: order.items.map(item => ({
                productName: item.product.productName,
                originalPrice: item.originalPrice,
                currentPrice: item.currentPrice,
                quantity: item.quantity,
                size: item.size,
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

        if (!['Pending', 'Processing'].includes(order.orderStatus)) {
            return res.status(400).json({
                message: 'Order cannot be cancelled in current status'
            });
        }

        // Update stock quantities
        await Promise.all(order.items.map(async (item) => {
            const product = await ProductSchema.findById(item.product);
            const sizeIndex = product.availableSizes.findIndex(s => s.size === item.size);
            
            if (sizeIndex !== -1) {
                product.availableSizes[sizeIndex].quantity += item.quantity;
                const totalStock = product.availableSizes.reduce((sum, size) => sum + size.quantity, 0);
                product.status = totalStock > 0 ? 'active' : 'outOfStock';
                await product.save();
            }
        }));

        // Update order status while preserving original amounts
        order.orderStatus = 'Cancelled';
        order.cancelReason = cancelReason;
        order.paymentStatus = 'failed';
        order.currentAmount = 0; // Set current amount to 0 for cancelled orders
        // Note: originalAmount and initialTotalAmount remain unchanged

        // Mark all items as cancelled while preserving their original prices
        order.items.forEach(item => {
            if (item.itemStatus !== 'Cancelled') {
                item.itemStatus = 'Cancelled';
                item.cancelledAt = new Date();
                item.cancelReason = cancelReason;
                // Keep originalPrice unchanged but set currentPrice to 0
                item.currentPrice = 0;
            }
        });
        
        // Add cancellation to refund history if payment was made
        // if (order.paymentStatus !== 'pending') {
        //     order.refundHistory.push({
        //         amount: order.currentAmount,
        //         date: new Date(),
        //         reason: cancelReason,
        //         status: 'pending'
        //     });
        //     order.totalRefundAmount = order.originalAmount; // Use original amount for refund
        // }

        await order.save();

        res.status(200).json({
            message: 'Order cancelled successfully',
            order: {
                orderId: order.orderId,
                originalAmount: order.originalAmount,
                initialTotalAmount: order.initialTotalAmount,
                currentAmount: order.currentAmount,
                orderStatus: order.orderStatus,
                cancelReason: order.cancelReason,
                paymentStatus: order.paymentStatus,
                // refundStatus: order.refundHistory.length > 0 ? 'pending' : 'none'
            }
        });
    } catch (error) {
        console.error('Error in cancelOrder:', error);
        res.status(500).json({ message: 'Error cancelling order', error: error.message });
    }
};
const cancelOrderItem = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const { cancelReason } = req.body;
        const userId = req.user.data.id;

        // Find order and verify ownership
        const order = await Order.findOne({ 
            _id: orderId, 
            user: userId 
        }).populate('items.product');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Find the specific item
        const orderItem = order.items.id(itemId);
        if (!orderItem) {
            return res.status(404).json({ message: 'Item not found in order' });
        }

        // Validate order status
        if (!['Pending', 'Processing'].includes(order.orderStatus)) {
            return res.status(400).json({
                message: 'Order items cannot be cancelled in current status'
            });
        }

        // Check if item is already cancelled
        if (orderItem.itemStatus === 'Cancelled') {
            return res.status(400).json({
                message: 'Item is already cancelled'
            });
        }

        // Restore product quantity
        const product = await ProductSchema.findById(orderItem.product);
        const sizeIndex = product.availableSizes.findIndex(s => s.size === orderItem.size);
        
        if (sizeIndex !== -1) {
            // Restore quantity
            product.availableSizes[sizeIndex].quantity += orderItem.quantity;

            // Update product status
            const totalRemainingStock = product.availableSizes.reduce(
                (total, size) => total + size.quantity,
                0
            );
            product.status = totalRemainingStock > 0 ? 'active' : 'outOfStock';
            await product.save();
        }

        // Update item status and details
        orderItem.itemStatus = 'Cancelled';
        orderItem.cancelReason = cancelReason;
        orderItem.cancelledAt = new Date();

        // Update order total amount
        order.totalAmount -= orderItem.discountedPrice;

        // Check if all items are cancelled
        const allItemsCancelled = order.items.every(item => item.itemStatus === 'Cancelled');
        if (allItemsCancelled) {
            order.orderStatus = 'Cancelled';
            order.cancelReason = 'All items cancelled';
            order.paymentStatus = 'failed';
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Item cancelled successfully',
            data: {
                order: {
                    orderId: order.orderId,
                    orderStatus: order.orderStatus,
                    paymentStatus: order.paymentStatus,
                    totalAmount: order.totalAmount,
                    cancelledItem: {
                        itemId: orderItem._id,
                        productName: orderItem.product.productName,
                        cancelReason,
                        cancelledAt: orderItem.cancelledAt
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error in cancelOrderItem:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error cancelling order item', 
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

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { orderStatus } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Status transition validation remains the same...

        if (orderStatus === 'Cancelled') {
            // Set current amount to 0 but preserve original amounts
            order.currentAmount = 0;
            order.paymentStatus = 'failed';
            
            if (order.paymentStatus !== 'pending') {
                const refundAmount = order.originalAmount; // Use original amount for refund
                order.refundHistory.push({
                    amount: refundAmount,
                    date: new Date(),
                    reason: 'Order cancelled by admin',
                    status: 'pending'
                });
                order.totalRefundAmount = refundAmount;
            }

            // Update all items while preserving original prices
            order.items.forEach(item => {
                if (item.itemStatus !== 'Cancelled') {
                    item.itemStatus = 'Cancelled';
                    item.cancelledAt = new Date();
                    item.cancelReason = 'Order cancelled by admin';
                    item.currentPrice = 0; // Set current price to 0 but keep originalPrice
                }
            });
        } else if (orderStatus === 'Delivered') {
            order.paymentStatus = 'completed';
            // Update non-cancelled items
            order.items.forEach(item => {
                if (item.itemStatus !== 'Cancelled') {
                    item.itemStatus = 'Delivered';
                }
            });
        }

        order.orderStatus = orderStatus;
        await order.save();

        res.status(200).json({
            message: 'Order status updated successfully',
            order: {
                orderId: order.orderId,
                orderStatus: order.orderStatus,
                originalAmount: order.originalAmount,
                initialTotalAmount: order.initialTotalAmount,
                currentAmount: order.currentAmount,
                paymentStatus: order.paymentStatus,
                totalRefundAmount: order.totalRefundAmount,
                refundHistory: order.refundHistory,
                items: order.items.map(item => ({
                    itemId: item._id,
                    status: item.itemStatus,
                    originalPrice: item.originalPrice,
                    currentPrice: item.currentPrice,
                    refundStatus: item.refundStatus,
                    refundAmount: item.refundAmount
                }))
            }
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Error updating order status', error: error.message });
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
    cancelOrderItem ,
    verifyPayment
}