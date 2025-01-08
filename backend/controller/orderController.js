const Order = require('../model/orderSchema');
const Cart = require('../model/cartSchema');
const ProductSchema = require('../model/productSchema');


// Create a new order from cart
const createOrder = async (req, res) => {
    try {
        const { shippingAddressId, paymentMethod, orderNotes } = req.body;
        const userId = req.user.data.id;
        console.log("userID", userId)

        // Get user's cart
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


        for (const item of cart.items) {
            const product = item.product;

            // Check if product is active
            if (!product.isactive) {
                return res.status(400).json({
                    message: `Product "${product.productName}" is currently unavailable`
                });
            }

            // Check if category is active
            if (!product.category.isactive) {
                return res.status(400).json({
                    message: `Category "${product.category.CategoryName}" is currently unavailable`
                });
            }
        }

        // Verify product availability and update stock
        for (const item of cart.items) {
            const product = await ProductSchema.findById(item.product._id);
            const sizeIndex = product.availableSizes.findIndex(s => s.size === item.size);

            if (sizeIndex === -1 || product.availableSizes[sizeIndex].quantity < item.quantity) {
                return res.status(400).json({
                    message: `${product.productName} is out of stock in size ${item.size}`
                });
            }

            // Update product stock
            product.availableSizes[sizeIndex].quantity -= item.quantity;

            // Check total available quantity across all sizes
            const totalRemainingStock = product.availableSizes.reduce(
                (total, size) => total + size.quantity,
                0
            );

            // Update product status based on total stock
            product.status = totalRemainingStock > 0 ? 'active' : 'outOfStock';

            await product.save();
        }

        // Rest of your order creation code...
        const order = new Order({
            user: userId,
            items: cart.items,
            shippingAddress: shippingAddressId,
            totalAmount: cart.totalAmount,
            paymentMethod,
            orderNotes,
            estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        await order.save();

        // Clear cart after successful order
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
}
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
        console.log(orderId, "order id from backend")
        const { cancelReason } = req.body;
        console.log(cancelReason, "the body from frondend ")
        const userId = req.user.data.id;
        console.log(userId, "user id from backend")
        const order = await Order.findOne({ _id: orderId, user: userId });
        console.log(order, "order of backend")

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
            order.orderStatus = 'Cancelled';
            order.cancelReason = cancelReason;
            // Add this line to update payment status
            order.paymentStatus = 'failed';
            await product.save();
        }

        order.orderStatus = 'cancelled';
        order.cancelReason = cancelReason;
        await order.save();

        res.status(200).json({
            message: 'Order cancelled successfully',
            order
        });
    } catch (error) {
        console.log(error, "backend error")
        res.status(500).json({ message: 'Error cancelling order', error: error.message });
    }
}

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
}