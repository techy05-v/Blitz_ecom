const Cart = require("../model/cartSchema")
const ProductSchema = require("../model/productSchema")
const CategorySchema = require("../model/categorySchema")
const { calculateBestDiscount, calculateSalePrice } = require('../utils/priceUtils/priceCalculation');
const addToCart = async (req, res) => {
    try {
        const userId = req?.user?.data?._id;
        console.log("klllll",userId)
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        const { productId, quantity, size } = req.body;

        // Validate quantity limit
        if (quantity > 5) {
            return res.status(400).json({
                success: false,
                message: "Cannot Add more than 5 items of the same Product"
            });
        }

        // Get product with populated offers and category
        const product = await ProductSchema.findById(productId)
            .populate({
                path: 'offers',
                select: 'name discountPercent startDate endDate isActive'
            })
            .populate({
                path: 'category',
                populate: {
                    path: 'offers',
                    select: 'name discountPercent startDate endDate isActive'
                }
            });

        if (!product) {
            return res.status(400).json({
                success: false,
                message: "Product not found"
            });
        }

        if (!product.isactive) {
            return res.status(400).json({
                success: false,
                message: "This product is not available"
            });
        }

        const category = await CategorySchema.findById(product.category);
        if (!category || !category.isactive) {
            return res.status(400).json({
                success: false,
                message: "This category is currently not available"
            });
        }

        // Find available quantity for specific size
        const sizeInfo = product.availableSizes.find(s => s.size === size);
        if (!sizeInfo) {
            return res.status(400).json({
                success: false,
                message: "Selected size not available"
            });
        }

        // Check if requested quantity exceeds available stock
        if (quantity > sizeInfo.quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${sizeInfo.quantity} items available in stock for size ${size}`
            });
        }

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({
                user: userId,
                items: [],
                totalAmount: 0
            });
        }

        // Calculate price with best available discount
        const bestDiscount = await calculateBestDiscount(product);
        const price = product.regularPrice;
        const discountedPrice = price - (price * (bestDiscount / 100));

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.product.toString() === productId && item.size === size
        );

        if (existingItemIndex > -1) {
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;
            if (newQuantity > 5) {
                return res.status(400).json({
                    success: false,
                    message: "Total quantity cannot exceed 5 items for the same product and size"
                });
            }

            if (newQuantity > sizeInfo.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${sizeInfo.quantity} items available in stock for size ${size}`
                });
            }

            cart.items[existingItemIndex].quantity = newQuantity;
            cart.items[existingItemIndex].price = price;
            cart.items[existingItemIndex].discountedPrice = discountedPrice;
        } else {
            cart.items.push({
                product: productId,
                quantity,
                size,
                price,
                discountedPrice
            });
        }

        // Recalculate total amount
        cart.totalAmount = cart.items.reduce((total, item) => {
            return total + (item.discountedPrice * item.quantity);
        }, 0);

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Item added to cart successfully",
            cart
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error in adding to cart",
            error: error.message
        });
    }
};

// Rest of the controller functions remain the same
const getCartItems = async (req, res) => {
    try {
        const userId = req.user.data._id;
        const cart = await Cart.findOne({ user: userId })
            .populate({
                path: 'items.product',
                select: 'productName images description regularPrice salePrice discountPercent offers isactive availableSizes category',
                match: { isactive: true },
                populate: [
                    {
                        path: 'offers',
                        match: {
                            isActive: true,
                            startDate: { $lte: new Date() },
                            endDate: { $gte: new Date() }
                        },
                        select: 'name discountPercent startDate endDate'
                    },
                    {
                        path: 'category',
                        select: 'name offers isactive',
                        populate: {
                            path: 'offers',
                            match: {
                                isActive: true,
                                startDate: { $lte: new Date() },
                                endDate: { $gte: new Date() }
                            },
                            select: 'name discountPercent startDate endDate'
                        }
                    }
                ]
            });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart is empty",
                cart: {
                    items: [],
                    totalAmount: 0
                }
            });
        }

        // Filter out null products and recalculate prices
        cart.items = cart.items
            .filter(item => item.product !== null)
            .map(item => {
                const price = Number(item.price || item.product.regularPrice);
                const discountedPrice = Number(item.discountedPrice || item.product.salePrice || price);

                return {
                    ...item.toObject(),
                    price: price,
                    discountedPrice: discountedPrice
                };
            });

        // Recalculate total amount with updated prices
        cart.totalAmount = cart.items.reduce((total, item) => {
            return total + (Number(item.discountedPrice || 0) * Number(item.quantity || 0));
        }, 0);

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Cart items fetched successfully",
            cart
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error in getting cart items",
            error: error.message
        });
    }
};

const updateCartItem = async (req, res) => {
    try {
        const { productId, quantity, size } = req.body;
        const userId = req.user.data._id;

        // Only validate individual product quantity
        if (quantity > 5) {
            return res.status(400).json({
                success: false,
                message: "Quantity cannot exceed 5 items"
            });
        }

        const product = await ProductSchema.findById(productId);
        if (!product) {
            return res.status(400).json({
                success: false,
                message: "Product not found"
            });
        }

        // Find available quantity for specific size
        const sizeInfo = product.availableSizes.find(s => s.size === size);
        if (!sizeInfo) {
            return res.status(400).json({
                success: false,
                message: "Selected size not available"
            });
        }

        // Check if requested quantity exceeds available stock for specific size
        if (quantity > sizeInfo.quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${sizeInfo.quantity} items available in stock for size ${size}`
            });
        }

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId && item.size === size
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Item not found in cart"
            });
        }

        cart.items[itemIndex].quantity = quantity;
        cart.totalAmount = cart.items.reduce((total, item) => {
            return total + (item.discountedPrice * item.quantity);
        }, 0);

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Cart item updated successfully",
            cart
        });

    } catch (error) {
        console.error('Update cart item error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

const removeCartItems = async (req, res) => {
    try {
        const { productId, size } = req.body
        const userId = req.user.data._id

        const cart = await Cart.findOne({ user: userId })
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart is empty ",
            })
        }
        cart.items = cart.items.filter(
            item => !(item.product.toString() === productId && item.size === size)
        )
        cart.totalAmount = cart.items.reduce((total, item) => {
            return total + (item.discountedPrice * item.quantity);
        }, 0);

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Item removed from cart successfully",
            cart
        });

    }
    catch (error) {
        return res.status(400).json({
            success: false,
            messsage: "Cart not found"
        })
    }
}

const clearCart = async (req, res) => {
    try {
        const userId = req.user.data._id
        const cart = await Cart.findOne({ user: userId })
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart is empty ",
            })
        }
        cart.items = []
        cart.totalAmount = 0
        await cart.save()
        return res.status(200).json({
            success: true,
            message: "Cart cleared successfully",
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "internal server error",
            error: error.message
        })
    }
}

module.exports = {
    addToCart,
    getCartItems,
    clearCart,
    removeCartItems,
    updateCartItem
}