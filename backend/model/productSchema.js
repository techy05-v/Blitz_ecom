// productSchema.js
const mongoose = require('mongoose');
const { type } = require('os');

const productSchema = new mongoose.Schema(
  {
    productName: { 
      type: String, 
      required: true 
    },
    category: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'CategorySchema', 
      required: true 
    },
    images: [
      { 
        type: String, 
        required: true 
      }
    ],
    description: { 
      type: String, 
      required: true 
    },
    regularPrice: { 
      type: Number, 
      required: true 
    },
    salePrice:{
      type:Number,
      required:true
    },
    discountPercent: { 
      type: Number, 
      default: 0 
    },
    offers:[{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Offer"
    }],
    availableSizes: [
      {
        size: { 
          type: String,
          required: true 
        },
        quantity: { 
          type: Number, 
          required: true,
          min: 0 
        },
        stockStatus: {
          type: String,
          enum: ['inStock', 'outOfStock'],
          default: 'inStock'
        }
      }
    ],
    color: { 
      type: String,
      required: false 
    },
    tags: [
      { 
        type: String 
      }
    ],
    isactive: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true 
  }
);

// Middleware to update stock status based on quantity
productSchema.pre('save', function(next) {
  this.availableSizes.forEach(sizeObj => {
    sizeObj.stockStatus = sizeObj.quantity > 0 ? 'inStock' : 'outOfStock';
  });
  next();
});

module.exports = mongoose.model('ProductSchema', productSchema);