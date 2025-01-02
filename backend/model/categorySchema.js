const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  CategoryName: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  CreateDate: { 
    type: Date, 
    default: Date.now 
  },
  isactive: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true 
});
categorySchema.virtual('calculateProductCount', {
  ref: 'ProductSchema', // Assuming you have a Product model
  localField: '_id',
  foreignField: 'category',
  count: true
});
module.exports = mongoose.model('CategorySchema', categorySchema);