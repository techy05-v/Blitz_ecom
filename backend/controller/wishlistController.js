const ProductSchema = require("../model/productSchema");
const Wishlist = require("../model/wishlistModel");
const User = require("../model/userModel"); // Fixed import

const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        console.log(productId)
        const userId = req.user.data._id;
        console.log(userId)
        const userIdString = req.user.data.user_id;

        const user = await User.findById(userId);
        if (user.isBlocked) {
            return res.status(403).json({ message: "User is blocked" });
        }

        const product = await ProductSchema.findOne({ _id: productId, isactive: true });
        console.log(product)
        if (!product) {
            return res.status(404).json({ message: "The product is not found or inactive" });
        }

        // Find the existing wishlist or create new one
        let wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            wishlist = new Wishlist({ // Fixed constructor name
                user: userId,
                user_id: userIdString,
                products: []
            });
        }

        // Check if product already exists in wishlist
        const productExist = wishlist.products.some(item => item.product.toString() === productId);
        if (productExist) {
            return res.status(400).json({ message: "Product already in wishlist" });
        }

        // Add product to wishlist
        wishlist.products.push({ product: productId });
        await wishlist.save();

        await wishlist.populate({
            path: "products.product",
            select: "productName images regularPrices discountPercent availableSizes"
        });

        res.status(200).json({
            success: true,
            message: "Product added to wishlist successfully",
            wishlist
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error adding product to wishlist",
            error: error.message
        });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.data._id;
        
        const wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: "Wishlist not found"
            });
        }

        // Remove the product from wishlist
        wishlist.products = wishlist.products.filter(
            item => item.product.toString() !== productId
        );
        await wishlist.save();

        res.status(200).json({
            success: true,
            message: "Product removed from the wishlist successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to remove the item from wishlist",
            error: error.message
        });
    }
};

const getWishlist = async (req, res) => {
    try {
        const userId = req.user.data._id;
        let wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: "No wishlist found",
                wishlist: {
                    user: userId,
                    products: []
                }
            });
        }

        // Added population of product details
        await wishlist.populate({
            path: "products.product",
            select: "productName images regularPrice discountPercent availableSizes"
        });

        res.status(200).json({ // Added success response
            success: true,
            message: "Wishlist retrieved successfully",
            wishlist
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in fetching the wishlist",
            error: error.message
        });
    }
};

const clearWishlist = async (req, res) => {
    try {
        const userId = req.user.data._id;
        const wishlist = await Wishlist.findOne({ user: userId });
        
        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: "Wishlist not found"
            });
        }

        wishlist.products = [];
        await wishlist.save(); // Fixed from Wishlist to wishlist

        res.status(200).json({
            success: true,
            message: "Wishlist cleared successfully",
            wishlist
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to clear wishlist", // Fixed error message
            error: error.message
        });
    }
};

module.exports = {
    clearWishlist,
    getWishlist,
    addToWishlist,
    removeFromWishlist
};