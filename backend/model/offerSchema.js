const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  discountPercent: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  // Can be either a product ID or category ID
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  // 'product' or 'category'
  targetType: {
    type: String,
    required: true,
    enum: ['product', 'category']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Offer', offerSchema);