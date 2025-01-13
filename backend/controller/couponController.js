
const Coupon=  require("../model/couponSchema")
const mongoose = require("mongoose");
const createCoupon = async (req, res) => {
    try {
        const {
            code,
            description,
            expiresOn,
            offerPercentage,
            minimumPrice,
            maximumDiscount,
            usageLimit,
        } = req.body;

        // Validate required fields
        if (!code || !description || !expiresOn || !offerPercentage || !minimumPrice || !maximumDiscount || !usageLimit) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Validate numeric fields
        if (offerPercentage <= 0 || maximumDiscount <= 0 || minimumPrice <= 0 || usageLimit <= 0) {
            return res.status(400).json({
                success: false,
                message: "Numeric values must be greater than 0"
            });
        }

        // Validate offer percentage is reasonable
        if (offerPercentage > 100) {
            return res.status(400).json({
                success: false,
                message: "Offer percentage cannot exceed 100%"
            });
        }

        // Validate expiry date 
        if (new Date(expiresOn) <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Expiry date must be in the future"
            });
        }

        const newCoupon = new Coupon({
            code: code.toUpperCase(),
            description,
            expiresOn,
            offerPercentage,
            minimumPrice,
            maximumDiscount,
            usageLimit,
            isList: true,
            usedCount: 0,
            userId: []
        });

        await newCoupon.save();
        res.status(201).json({
            success: true,
            message: "Coupon created successfully",
            coupon: newCoupon
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Coupon code already exists"
            });
        }
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const applyCoupon = async (req, res) => {
    try {
        const { code, cartTotal, userId } = req.body;

        if (!code || !cartTotal || !userId) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            isList: true,
            expiresOn: { $gt: new Date() }
        });

        if (!coupon) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired coupon"
            });
        }

        // Check if user has already used the coupon
        if (coupon.userId.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: "You have already used this coupon"
            });
        }

        // Check usage limit
        if (coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({
                success: false,
                message: "Coupon usage limit reached"
            });
        }

        // Check minimum price requirement 
        if (cartTotal < coupon.minimumPrice) {
            return res.status(400).json({
                success: false,
                message: `Minimum purchase amount required: ₹${coupon.minimumPrice}`
            });
        }

        let discountAmount = (cartTotal * coupon.offerPercentage) / 100;

        // Apply maximum discount limit
        discountAmount = Math.min(discountAmount, coupon.maximumDiscount);

        // Update coupon usage
        coupon.userId.push(userId);
        coupon.usedCount = coupon.usedCount + 1;

        // If usage limit reached, deactivate coupon
        if (coupon.usedCount >= coupon.usageLimit) {
            coupon.isList = false;
        }

        await coupon.save();

        res.status(200).json({
            success: true,
            discountAmount,
            finalAmount: cartTotal - discountAmount,
            message: "Coupon applied successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const listCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({
            isList: true,
            expiresOn: { $gt: new Date() },
            $expr: { $lt: ["$usedCount", "$usageLimit"] }  // Fixed comparison
        }).select('-userId');

        res.status(200).json({
            success: true,
            count: coupons.length,
            coupons
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Coupon ID is required"
            });
        }

        const coupon = await Coupon.findByIdAndDelete(id);

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Coupon deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const validateCoupon = async (req, res) => {
    try {
        const { code, cartTotal, userId } = req.body;

        if (!code || !cartTotal || !userId) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            isList: true,
            expiresOn: { $gt: new Date() }
        });

        if (!coupon) {
            return res.status(200).json({
                success: false,
                isValid: false,
                message: "Invalid or expired coupon"
            });
        }

        const validationResults = {
            isValid: true,
            minimumPriceValid: cartTotal >= coupon.minimumPrice,
            notUsedByUser: !coupon.userId.includes(userId),
            usageLimitValid: coupon.usedCount < coupon.usageLimit
        };

        res.status(200).json({
            success: true,
            ...validationResults,
            minimumPrice: coupon.minimumPrice,
            offerPercentage: coupon.offerPercentage,
            maximumDiscount: coupon.maximumDiscount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createCoupon,
    applyCoupon,
    listCoupons,
    deleteCoupon,
    validateCoupon
};