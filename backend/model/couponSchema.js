// In couponSchema.js

const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    description: {
        type: String,
        required: true
    },
    expiresOn: {
        type: Date,
        required: true
    },
    offerPercentage: {
        type: Number,
        required: true
    },
    minimumPrice: {
        type: Number,
        required: true
    },
    maximumDiscount: {
        type: Number,
        required: true
    },
    isList: {
        type: Boolean,
        default: true
    },
    usedCount: {
        type: Number,
        default: 0
    },
    usageLimit: {
        type: Number,
        default: 1 // Number of times each user can use the coupon
    },
    maxGlobalUsage: {
        type: Number,
        default: 10 // Total number of times the coupon can be used across all users
    },
    userId: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        usageCount: {
            type: Number,
            default: 0
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);