const Product = require('../model/productSchema');
const Category = require('../model/categorySchema');

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

    // Remove any status field if it exists
    delete productData.status;

    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save();

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
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Clean availableSizes data if provided
    if (updateData.availableSizes) {
      updateData.availableSizes = updateData.availableSizes.map(size => ({
        size: size.size,
        quantity: size.quantity
      }));
    }

    // Remove any status field
    delete updateData.status;

    // Handle image updates if provided
    if (updateData.images && updateData.images.length > 0) {
      const existingImages = existingProduct.images || [];
      const removedImages = existingImages.filter(img => !updateData.images.includes(img));

      if (removedImages.length > 0) {
        await Promise.all(
          removedImages.map(async (imageUrl) => {
            try {
              const publicId = imageUrl.split('/').pop().split('.')[0];
              await cloudinary.uploader.destroy(`products/${publicId}`);
            } catch (error) {
              console.error('Error deleting image:', error);
            }
          })
        );
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating product', 
      error: error.message 
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
    
    const products = await Product.find()
      .populate('category', 'CategoryName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

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
    const product = await Product.findOne({ 
      _id: req.params.id,
      isactive: true 
    }).populate('category', 'CategoryName');
    
    if (!product) {
      return res.status(404).json({ 
        message: 'Product not found',
        success: false 
      });
    }
    
    res.status(200).json({ 
      message: 'Product retrieved successfully',
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({ 
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