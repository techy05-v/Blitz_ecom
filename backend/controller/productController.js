const Product = require('../model/productSchema');
const Category = require('../model/categorySchema');
const mongoose = require("mongoose")
const { calculateBestDiscount,
  calculateSalePrice,
  updateProductPrices } = require("../utils/priceUtils/priceCalculation")
// Create new product
const createProduct = async (req, res) => {
  try {
    const productData = req.body;

    // Validate category
    const categoryExists = await Category.findById(productData.category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Clean availableSizes data
    if (productData.availableSizes) {
      productData.availableSizes = productData.availableSizes.map(size => ({
        size: size.size,
        quantity: size.quantity
      }));
    }
    const initialDiscount = productData.discountPercent || 0;
    productData.salePrice = calculateSalePrice(productData.regularPrice, initialDiscount);
    // Remove any status field if it exists
    delete productData.status;

    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save();
    const updatedPrices = await updateProductPrices(savedProduct)
    const finalProduct = await Product.findById(savedProduct._id)
      .populate('category', 'CategoryName')
      .populate({
        path: 'offers',
        select: 'name discountPercent startDate endDate isActive targetType'
      });
    res.status(201).json({
      message: 'Product created successfully',
      product: savedProduct
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating product',
      error: error.message
    });
  }
};

// Update product
// In productController.js, update the updateProduct function

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("iddddfffffffffffffff",id)
    let updateData = req.body;

    // Input validation
    // if (!mongoose.Types.ObjectId.isValid(id)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Invalid product ID format'
    //   });
    // }

    // First check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Validate price and discount values upfront
    if (updateData.regularPrice !== undefined) {
      if (typeof updateData.regularPrice !== 'number' || updateData.regularPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Regular price must be a non-negative number'
        });
      }
    }

    if (updateData.discountPercent !== undefined) {
      if (typeof updateData.discountPercent !== 'number' || 
          updateData.discountPercent < 0 || 
          updateData.discountPercent > 100) {
        return res.status(400).json({
          success: false,
          message: 'Discount percentage must be between 0 and 100'
        });
      }
    }

    // Calculate new sale price if needed
    if (updateData.regularPrice !== undefined || updateData.discountPercent !== undefined) {
      const regularPrice = updateData.regularPrice ?? existingProduct.regularPrice;
      const discountPercent = updateData.discountPercent ?? existingProduct.discountPercent;
      
      try {
        updateData.salePrice = calculateSalePrice(regularPrice, discountPercent);
      } catch (priceError) {
        return res.status(400).json({
          success: false,
          message: priceError.message
        });
      }
    }

    // Rest of the existing validation logic...
    if (updateData.availableSizes) {
      if (!Array.isArray(updateData.availableSizes)) {
        return res.status(400).json({
          success: false,
          message: 'availableSizes must be an array'
        });
      }

      updateData.availableSizes = updateData.availableSizes.map(size => {
        if (!size.size || typeof size.quantity !== 'number' || size.quantity < 0) {
          throw new Error('Invalid size data provided');
        }
        return {
          size: size.size,
          quantity: size.quantity,
          stockStatus: size.quantity > 0 ? 'inStock' : 'outOfStock'
        };
      });
    }

    // Remove protected fields
    const protectedFields = ['status', '_id', 'createdAt', 'updatedAt'];
    protectedFields.forEach(field => delete updateData[field]);

    // Update the product with validation
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    ).populate('category', 'CategoryName')
      .populate({
        path: 'offers',
        select: 'name discountPercent startDate endDate isActive targetType',
        match: { isActive: true }
      });

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found after update'
      });
    }

    // Update prices with error boundary
    try {
      await updateProductPrices(updatedProduct);
      
      // Fetch fresh data after price update
      const finalProduct = await Product.findById(id)
        .populate('category', 'CategoryName')
        .populate({
          path: 'offers',
          select: 'name discountPercent startDate endDate isActive targetType',
          match: { isActive: true }
        });

      return res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        product: finalProduct
      });
    } catch (priceError) {
      console.error('Error updating prices:', priceError);
      return res.status(200).json({
        success: true,
        message: 'Product updated successfully, but price calculations may be outdated',
        warning: 'Failed to update prices',
        product: updatedProduct
      });
    }

  } catch (error) {
    console.error('Error in updateProduct:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating product',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const total = await Product.countDocuments();

    // First, get all products with populated data
    let products = await Product.find()
      .populate('category', 'CategoryName')
      .populate({
        path: 'offers',
        select: 'name discountPercent startDate endDate isActive targetType'
      })
      .populate({
        path: 'category',
        populate: {
          path: 'offers',
          select: 'name discountPercent startDate endDate isActive targetType'
        }
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Update and save each product's sale price
    products = await Promise.all(products.map(async (product) => {
      const bestDiscount = await calculateBestDiscount(product);
      
      // Only update if there's a change in discount
      if (product.discountPercent !== bestDiscount) {
        const newSalePrice = calculateSalePrice(product.regularPrice, bestDiscount);
        
        // Update in database
        const updatedProduct = await Product.findByIdAndUpdate(
          product._id,
          { 
            $set: {
              discountPercent: bestDiscount,
              salePrice: newSalePrice
            }
          },
          { new: true }
        ).populate('category', 'CategoryName')
          .populate({
            path: 'offers',
            select: 'name discountPercent startDate endDate isActive targetType'
          })
          .populate({
            path: 'category',
            populate: {
              path: 'offers',
              select: 'name discountPercent startDate endDate isActive targetType'
            }
          });
          
        return updatedProduct;
      }
      return product;
    }));

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      message: 'Products fetched successfully',
      products,
      currentPage: page,
      totalPages,
      total,
      limit
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// Get single product
const getProductById = async (req, res) => {
  try {
    // First find the basic product to ensure it exists and is active
    const basicProduct = await Product.findOne({
      _id: req.params.id,
      isactive: true
    });

    if (!basicProduct) {
      return res.status(404).json({
        message: 'Product not found',
        success: false
      });
    }

    // Update prices using the basic product
    await updateProductPrices(basicProduct._id);
    
    // Then fetch fresh data with all populated fields
    const product = await Product.findOne({
      _id: req.params.id,
      isactive: true
    })
      .populate('category', 'CategoryName')
      .populate({
        path: 'offers',
        select: 'name discountPercent startDate endDate isActive targetType'
      });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found after price update',
        success: false
      });
    }

    return res.status(200).json({
      message: 'Product retrieved successfully',
      success: true,
      product
    });
  } catch (error) {
    console.error('Error in getProductById:', error);
    return res.status(500).json({
      message: 'Error fetching product',
      success: false,
      error: error.message
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete images from cloudinary
    await Promise.all(
      product.images.map(async (imageUrl) => {
        try {
          const publicId = imageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`products/${publicId}`);
        } catch (error) {
          console.error('Error deleting image:', error);
        }
      })
    );

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting product',
      error: error.message
    });
  }
};

// Toggle product active status
const toggleProductActive = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isactive = !product.isactive;
    await product.save();

    res.status(200).json({
      message: `Product ${product.isactive ? 'activated' : 'deactivated'} successfully`,
      product
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error toggling product status',
      error: error.message
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleProductActive
};