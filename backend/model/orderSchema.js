

const mongoose= require("mongoose")
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
    }
  }],
  shippingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AddressSchema',
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cash_on_delivery', 'upi'],
    required: true
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
    set: status => status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
},
// ..
  orderId: {
    type: String,
    unique: true,
    default: () => 'ORD' + Date.now() + Math.floor(Math.random() * 1000)
  },
  orderNotes: {
    type: String
  },
  estimatedDeliveryDate: {
    type: Date
  },
  cancelReason: {
    type: String
  }
}, {
  timestamps: true
});

orderSchema.index({ user: 1, orderId: 1 });
module.exports= mongoose.model("Order",orderSchema)