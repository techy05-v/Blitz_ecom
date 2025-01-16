// couponUtils.js

const Coupon = require("../model/couponSchema");
const mongoose = require("mongoose");

// Validates coupon without marking it as used
const validateCouponForCart = async (code, cartTotal, userId) => {
    if (!code || !cartTotal || !userId) {
        throw new Error("Missing required fields");
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

    // Check if user has already used this coupon in a completed order
    const userUsage = coupon.userId.find(entry => entry.userId.equals(userObjectId));
    if (userUsage && userUsage.usageCount >= 1) {
        throw new Error("You have already used this coupon");
    }

    if (cartTotal < coupon.minimumPrice) {
        throw new Error(`Minimum purchase amount required: ₹${coupon.minimumPrice}`);
    }

    // Calculate discount
    let discountAmount = (cartTotal * coupon.offerPercentage) / 100;
    discountAmount = Math.min(discountAmount, coupon.maximumDiscount);

    return {
        couponId: coupon._id,
        discountAmount,
        finalAmount: cartTotal - discountAmount
    };
};

// Marks coupon as used during order placement
const markCouponAsUsed = async (couponId, userId) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
        throw new Error("Coupon not found");
    }

    // Update user usage
    const userUsage = coupon.userId.find(entry => entry.userId.equals(userObjectId));
    if (userUsage) {
        userUsage.usageCount += 1;
    } else {
        coupon.userId.push({ userId: userObjectId, usageCount: 1 });
    }

    coupon.usedCount += 1;
    await coupon.save();

    return true;
};

module.exports = {
    validateCouponForCart,
    markCouponAsUsed
};