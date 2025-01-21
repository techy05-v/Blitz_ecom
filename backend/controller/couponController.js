const Coupon = require("../model/couponSchema")
const mongoose = require("mongoose");
const Order = require("../model/orderSchema")
const validateCoupon = async (code, cartTotal, userId, appliedCouponId = null) => {
    console.log('Validating coupon with:', { code, cartTotal, userId, appliedCouponId });

    if (!code || !cartTotal || !userId) {
        console.log('Missing required fields:', { code, cartTotal, userId });
        throw new Error("Missing required fields");
    }

    const totalAmount = parseFloat(cartTotal);
    if (isNaN(totalAmount)) {
        throw new Error("Invalid cart total amount");
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const coupon = await Coupon.findOne({
        code: code.toUpperCase(),
        isList: true,
        expiresOn: { $gt: new Date() }
    });

    if (!coupon) {
        throw new Error("Invalid or expired coupon");
    }

    // Check global usage limit
    if (coupon.usedCount >= coupon.maxGlobalUsage) {
        throw new Error("Coupon has reached its maximum global usage limit");
    }

    // Check individual user usage
    const userUsage = coupon.userId.find(usage => usage.userId.toString() === userObjectId.toString());
    if (userUsage && userUsage.usageCount >= coupon.usageLimit) {
        throw new Error(`You have already used this coupon ${coupon.usageLimit} time(s)`);
    }
    
    if (totalAmount < coupon.minimumPrice) {
        throw new Error(`Minimum purchase amount required: ₹${coupon.minimumPrice}`);
    }

    let discountAmount = (totalAmount * coupon.offerPercentage) / 100;
    discountAmount = Math.min(discountAmount, coupon.maximumDiscount);

    return {
        couponId: coupon._id,
        discountAmount,
        finalAmount: totalAmount - discountAmount,
        couponCode: coupon.code,
        offerPercentage: coupon.offerPercentage
    };
};

// Rest of the controller remains the same...
const createCoupon = async (req, res) => {
    try {
        const {
            code,
            description,
            expiresOn,
            offerPercentage,
            minimumPrice,
            maximumDiscount,
            usageLimit = 1,  // Individual usage limit
            maxGlobalUsage = 100  // Global usage limit
        } = req.body;

        // Validate required fields
        if (!code || !description || !expiresOn || !offerPercentage || !minimumPrice || !maximumDiscount) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const newCoupon = new Coupon({
            code: code.toUpperCase(),
            description,
            expiresOn,
            offerPercentage,
            minimumPrice,
            maximumDiscount,
            isList: true,
            usedCount: 0,
            usageLimit,    // Individual usage limit
            maxGlobalUsage, // Global usage limit
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
        const { code, cartTotal, userId, appliedCouponId } = req.body;
        console.log("Applying coupon with data:", {
            code,
            cartTotal,
            userId,
            appliedCouponId
        });
        
        const validationResult = await validateCoupon(code, cartTotal, userId, appliedCouponId);

        console.log("Validation result:", validationResult);

        res.status(200).json({
            success: true,
            ...validationResult,
            message: "Coupon applied successfully"
        });
    } catch (error) {
        console.error("Coupon application error:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const markCouponAsUsed = async (couponId, userId) => {
    try {
        console.log('Marking coupon as used:', { couponId, userId });
        const userObjectId = new mongoose.Types.ObjectId(userId);
        
        // Find the coupon
        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            throw new Error("Coupon not found");
        }

        // Check if user has already used this coupon
        const existingUserIndex = coupon.userId.findIndex(
            usage => usage.userId.toString() === userObjectId.toString()
        );

        let updateOperation;
        if (existingUserIndex === -1) {
            // First time user is using this coupon
            updateOperation = {
                $inc: { usedCount: 1 },
                $push: { userId: { userId: userObjectId, usageCount: 1 } }
            };
        } else {
            // User has used this coupon before, increment their usage count
            updateOperation = {
                $inc: { 
                    usedCount: 1,
                    [`userId.${existingUserIndex}.usageCount`]: 1
                }
            };
        }

        // Only mark coupon as inactive if global usage limit is reached
        if (coupon.usedCount + 1 >= coupon.maxGlobalUsage) {
            updateOperation.$set = { isList: false };
        }

        const updatedCoupon = await Coupon.findByIdAndUpdate(
            couponId,
            updateOperation,
            { new: true }
        );

        console.log('Updated coupon:', updatedCoupon);
        return true;
    } catch (error) {
        console.error('Error marking coupon as used:', error);
        throw error;
    }
};

const listCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({
            isList: true,
            expiresOn: { $gt: new Date() }
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

module.exports = {
    createCoupon,
    applyCoupon,
    listCoupons,
    deleteCoupon,
    markCouponAsUsed,
    validateCoupon

};