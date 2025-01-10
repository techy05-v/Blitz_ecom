// models/offerSchema.js
const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    description: { 
      type: String, 
      required: true,
      trim: true
    },
    offerType: {
      type: String,
      enum: ['percentage', 'flatAmount'],
      required: true
    },
    value: { 
      type: Number, 
      required: true,
      min: 0,
      validate: {
        validator: function(v) {
          if (this.offerType === 'percentage') {
            return v <= 100;
          }
          return true;
        },
        message: 'Percentage discount cannot exceed 100%'
      }
    },
    startDate: { 
      type: Date, 
      required: true 
    },
    endDate: { 
      type: Date, 
      required: true,
      validate: {
        validator: function(v) {
          return v > this.startDate;
        },
        message: 'End date must be after start date'
      }
    },
    applicableFor: {
      type: String,
      enum: ['product', 'category'],
      required: true
    },
    applicableItems: [{
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'applicableFor'
    }],
    stackable: { 
      type: Boolean, 
      default: false 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    minimumPurchase: {
      type: Number,
      default: 0,
      min: 0
    },
    maximumDiscount: {
      type: Number,
      min: 0
    }
  }, { 
    timestamps: true 
  });
  

module.exports = mongoose.model('Offer', offerSchema);