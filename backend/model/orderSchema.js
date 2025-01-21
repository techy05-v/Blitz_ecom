const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductSchema',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    size: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    discountedPrice: {
        type: Number,
        required: true
    },
    itemStatus: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Return_Pending', 'Returned'],
        default: 'Pending'
    },
    cancelReason: {
        type: String
    },
    cancelledAt: {
        type: Date
    },
    returnReason: {
        type: String
    },
    returnRequestedAt: {
        type: Date
    },
    returnApprovedAt: {
        type: Date
    },
    refundStatus: {
      type: String,
      enum: ['none', 'pending', 'processed', 'completed', 'failed'],
      default: 'none'
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    refundDate: {
        type: Date
    }
}],
  shippingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AddressSchema',
    required: true
  },
  originalAmount:{
    type:Number,
    required:true

  },
  initialTotalAmount:{},
  currentAmount:{
    type:Number,
    required:true,

  },
  razorpayOrderId: {
    type: String,
    sparse: true  // Allows null/undefined values while maintaining uniqueness
  },
  razorpayPaymentId: {
    type: String,
    sparse: true
  },
  razorpaySignature: {
    type: String,
    sparse: true
  },
  paymentCompletedAt: {
    type: Date
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cash_on_delivery', 'upi',"razorpay"],
    required: true
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  orderId: {
    type: String,
    unique: true,
    default: () => 'ORD' + Date.now() + Math.floor(Math.random() * 1000)
  },
  couponApplied: {
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon'
    },
    discountAmount: Number
  },
  totalRefundAmount: {
    type: Number,
    default: 0
  },
  refundHistory: [{
    amount: Number,
    date: Date,
    reason: String,
    status: {
      type: String,
      enum: ['none', 'pending', 'processed', 'completed', 'failed'],
      required: true
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    }
  }],
  orderNotes: String,
  estimatedDeliveryDate: Date,
  cancelReason: String
}, {
  timestamps: true
});

orderSchema.index({ user: 1, orderId: 1 });
module.exports = mongoose.model("Order", orderSchema);