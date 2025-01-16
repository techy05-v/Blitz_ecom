const Order = require('../model/orderSchema');
const Cart = require('../model/cartSchema');
const ProductSchema = require('../model/productSchema');
const {validateCoupon , markCouponAsUsed } = require('../controller/couponController')
const Coupon = require("../model/couponSchema")
// Create a new order from cart
const createOrder = async (req, res) => {
    try {
        const { shippingAddressId, paymentMethod, orderNotes, appliedCouponId } = req.body;
        const userId = req.user.data.id;
        console.log("userID", userId);

        // Get user's cart with populated product details
        const cart = await Cart.findOne({ user: userId })
            .populate({
                path: "items.product",
                populate: {
                    path: "category"
                }
            });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Validate product and category availability
        for (const item of cart.items) {
            const product = item.product;

            if (!product.isactive) {
                return res.status(400).json({
                    message: `Product "${product.productName}" is currently unavailable`
                });
            }

            if (!product.category.isactive) {
                return res.status(400).json({
                    message: `Category "${product.category.CategoryName}" is currently unavailable`
                });
            }
        }

        // Verify stock availability and prepare updates
        const stockUpdates = [];
        for (const item of cart.items) {
            const product = await ProductSchema.findById(item.product._id);
            const sizeIndex = product.availableSizes.findIndex(s => s.size === item.size);

            if (sizeIndex === -1 || product.availableSizes[sizeIndex].quantity < item.quantity) {
                return res.status(400).json({
                    message: `${product.productName} is out of stock in size ${item.size}`
                });
            }

            // Store update information
            stockUpdates.push({
                productId: product._id,
                sizeIndex,
                quantity: item.quantity,
                currentQuantity: product.availableSizes[sizeIndex].quantity
            });
        }

        let finalAmount = cart.totalAmount;
        let appliedCoupon = null;

        // Handle coupon if applied
        if (appliedCouponId) {
            try {
                const coupon = await Coupon.findById(appliedCouponId);
                if (!coupon) {
                    return res.status(400).json({
                        message: 'Invalid coupon'
                    });
                }
        
                const { discountAmount, finalAmount: discountedAmount } = await validateCoupon(
                    coupon.code,
                    cart.totalAmount,
                    userId,
                    appliedCouponId
                );
        
                finalAmount = discountedAmount;
                appliedCoupon = {
                    couponId: appliedCouponId,
                    discountAmount
                };
        
            } catch (error) {
                return res.status(400).json({
                    message: `Coupon error: ${error.message}`
                });
            }
        }

        // Create order first
        const order = new Order({
            user: userId,
            items: cart.items,
            shippingAddress: shippingAddressId,
            totalAmount: finalAmount,
            paymentMethod,
            orderNotes,
            couponApplied: appliedCoupon,
            estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        await order.save();

        // Update stock levels with optimistic locking
        for (const update of stockUpdates) {
            const product = await ProductSchema.findById(update.productId);
            
            // Verify quantity hasn't changed
            if (product.availableSizes[update.sizeIndex].quantity !== update.currentQuantity) {
                // If quantity has changed, delete the order and return error
                await Order.findByIdAndDelete(order._id);
                return res.status(400).json({
                    message: 'Stock levels have changed. Please try again.'
                });
            }

            // Update stock level
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

        res.status(200).json({
            message: 'Order created successfully',
            order
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Error creating order', error: error.message });
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

        console.log('OrderId:', orderId);
        console.log('UserId:', userId);
        console.log('User object:', req.user);

        const order = await Order.findOne({
            _id: orderId,
            user: userId
        })
            .populate('items.product')
            .populate('shippingAddress');

        console.log('Found order:', order);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({ order });
    } catch (error) {
        console.error('Detailed error:', error);
        res.status(500).json({ message: 'Error fetching order details', error: error.message });
    }
}

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

        // Restore product quantities
        for (const item of order.items) {
            const product = await ProductSchema.findById(item.product);
            const sizeIndex = product.availableSizes.findIndex(s => s.size === item.size);

            product.availableSizes[sizeIndex].quantity += item.quantity;

            // Check total available quantity across all sizes
            const totalRemainingStock = product.availableSizes.reduce(
                (total, size) => total + size.quantity,
                0
            );

            // Update product status based on total stock
            product.status = totalRemainingStock > 0 ? 'active' : 'outOfStock';
            await product.save();
        }

        // Update order status using the correct enum value 'Cancelled'
        order.orderStatus = 'Cancelled';
        order.cancelReason = cancelReason;
        order.paymentStatus = 'failed';
        
        await order.save();

        res.status(200).json({
            message: 'Order cancelled successfully',
            order
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

        console.log('Updating order:', orderId, 'to status:', orderStatus);

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Normalize the case for comparison
        const currentStatus = order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1).toLowerCase();
        const newStatus = orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1).toLowerCase();

        const validStatusTransitions = {
            'Pending': ['Processing', 'Cancelled'],
            'Processing': ['Shipped', 'Cancelled'],
            'Shipped': ['Delivered', 'Cancelled'],
            'Delivered': [],
            'Cancelled': []
        };

        if (!validStatusTransitions[currentStatus]?.includes(newStatus)) {
            return res.status(400).json({
                message: `Cannot transition from ${currentStatus} to ${newStatus}`,
                currentStatus: currentStatus,
                requestedStatus: newStatus
            });
        }

        // Store the status in the normalized format
        order.orderStatus = newStatus;
        if (order.orderStatus === 'Cancelled') {
            order.paymentStatus = 'failed';
        } else if (order.orderStatus === 'Delivered') {
            order.paymentStatus = 'completed';
        }
        await order.save();

        res.status(200).json({
            message: 'Order status updated successfully',
            order
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Error updating order status', error: error.message });
    }
};




module.exports = {

    createOrder,
    getUserOrders,
    cancelOrder,
    getOrderDetails,
    updateOrderStatus,
    getAllOrderByAdmin,
    cancelOrderItem 
}