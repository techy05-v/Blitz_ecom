const Category = require('../model/categorySchema');
const mongoose = require("mongoose")
const createCategory = async (req, res) => {
  try {
    // Consider using destructuring with more validation
    const { CategoryName, description, isactive = true } = req.body;

    // More robust validation
    if (!CategoryName || CategoryName.trim() === '') {
      return res.status(400).json({ 
        message: 'Category Name cannot be empty' 
      });
    }

    if (!description || description.trim() === '') {
      return res.status(400).json({ 
        message: 'Description cannot be empty' 
      });
    }

    // Check for existing category to prevent duplicates
    const existingCategory = await Category.findOne({ 
      CategoryName: CategoryName.trim() 
    });

    if (existingCategory) {
      return res.status(409).json({ 
        message: 'Category already exists' 
      });
    }

    const newCategory = new Category({
      CategoryName: CategoryName.trim(),
      description: description.trim(),
      isactive
    });

    const savedCategory = await newCategory.save();

    res.status(201).json({
      message: 'Category created successfully',
      category: savedCategory
    });
  } catch (error) {
    console.error('Create Category Error:', error);
    res.status(500).json({ 
      message: 'Error creating category', 
      error: error.message 
    });
  }
};
const getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skipIndex = (page - 1) * limit;

    const totalCategories = await Category.countDocuments({});
    const totalPages = Math.ceil(totalCategories / limit);

    const categories = await Category.find({})
      .skip(skipIndex)
      .limit(limit)
      .sort({ createdAt: -1 }); // Optional: sort by most recent

    res.status(200).json({
      categories,
      currentPage: page,
      totalPages,
      totalCategories
    });
  } catch (error) {
    console.error('Get Categories Error:', error);
    res.status(500).json({ 
      message: 'Error fetching categories', 
      error: error.message 
    });
  }
};
  

const getCategoryById = async (req, res) => {
  try {
    const {id}=req.params
    const category = await Category.findOne({ 
      _id: id, 
      isactive: true 
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json(category);
  } catch (error) {
    console.error('Get Category Error:', error);
    res.status(500).json({ 
      message: 'Error fetching category', 
      error: error.message 
    });
  }
};

const updateCategory = async (req, res) => {
  const { id } = req.params;
  const categoryData = req.body;

  try {
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Category ID format' });
    }

    // Prevent empty update attempts
    if (Object.keys(categoryData).length === 0) {
      return res.status(400).json({ message: 'No update data provided' });
    }

    // Validate specific fields if needed
    const allowedFields = ['CategoryName', 'description', 'isactive'];
    const invalidFields = Object.keys(categoryData).filter(
      field => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({ 
        message: `Invalid update fields: ${invalidFields.join(', ')}` 
      });
    }

    // Additional field-specific validations
    if (categoryData.CategoryName) {
      if (categoryData.CategoryName.trim() === '') {
        return res.status(400).json({ message: 'Category Name cannot be empty' });
      }
      // Optional: Add length constraint
      if (categoryData.CategoryName.length > 50) {
        return res.status(400).json({ message: 'Category Name too long' });
      }
    }

    if (categoryData.description) {
      if (categoryData.description.trim() === '') {
        return res.status(400).json({ message: 'Description cannot be empty' });
      }
      // Optional: Add length constraint
      if (categoryData.description.length > 500) {
        return res.status(400).json({ message: 'Description too long' });
      }
    }

    // Check for existing category if trying to update name
    if (categoryData.CategoryName) {
      const duplicateCategory = await Category.findOne({ 
        CategoryName: categoryData.CategoryName.trim(),
        _id: { $ne: id } // Exclude current category
      });

      if (duplicateCategory) {
        return res.status(409).json({ 
          message: 'Category name already exists' 
        });
      }
    }

    // Find and update category
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const sanitizedData = {
      ...(categoryData.CategoryName && { CategoryName: categoryData.CategoryName.trim() }),
      ...(categoryData.description && { description: categoryData.description.trim() }),
      ...(categoryData.isactive !== undefined && { isactive: categoryData.isactive })
    };

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { $set: sanitizedData },
      { 
        new: true,         
        runValidators: true, 
        context: 'query'   
      }
    );

    res.status(200).json({
      message: 'Category updated successfully',
      category: updatedCategory
    });

  } catch (error) {
    console.error('Update Category Error:', error);
    
    // More specific error handling
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation Error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      message: 'Error updating category',
      error: error.message
    });
  }
};

// const deleteCategory = async (req, res) => {
//   try {
//     const deletedCategory = await Category.findByIdAndUpdate(
//       req.params.id, 
//       { isactive: false }, 
//       { new: true }
//     );

//     if (!deletedCategory) {
//       return res.status(404).json({ message: 'Category not found' });
//     }

//     res.status(200).json({
//       message: 'Category soft deleted successfully',
//       category: deletedCategory
//     });
//   } catch (error) {
//     console.error('Delete Category Error:', error);
//     res.status(500).json({ 
//       message: 'Error deleting category', 
//       error: error.message 
//     });
//   }
// };

const toggleCategoryStatus = async (req, res) => {
  try {
    // Remove the console.log that's using categoryId
    const {categoryId} = req.params// Let's see what we're receiving
    
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Toggle the isactive status
    category.isactive = !category.isactive;
    await category.save();
    console.log(category);
    
    res.status(200).json({
      message: `Category ${category.isactive ? 'unblocked' : 'blocked'} successfully`,
      category
    });
  } catch (error) {
    console.error('Toggle Category Status Error:', error);
    res.status(500).json({ 
      message: 'Error toggling category status', 
      error: error.message 
    });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  //deleteCategory,
  toggleCategoryStatus
};

