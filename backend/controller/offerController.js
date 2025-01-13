const Offer = require("../model/offerSchema");
const ProductSchema = require('../model/productSchema');  // Changed to match model name
const CategorySchema = require('../model/categorySchema'); // Changed to match model name

// Helper function to check if target exists (product or category)
const checkTargetExists = async (targetId, targetType) => {
  const Model = targetType === 'product' ? ProductSchema : CategorySchema; // Updated model names
  const target = await Model.findById(targetId);
  return !!target;
};

const offerController = {
  // Create new offer
  createOffer: async (req, res) => {
    try {
      const { name, discountPercent, startDate, endDate, targetId, targetType } = req.body;

      // Validate discount percentage
      if (discountPercent < 0 || discountPercent > 100) {
        return res.status(400).json({
          success: false,
          message: 'Discount percentage must be between 0 and 100'
        });
      }

      // Check if target (product or category) exists
      const targetExists = await checkTargetExists(targetId, targetType);
      if (!targetExists) {
        return res.status(404).json({
          success: false,
          message: `${targetType} not found`
        });
      }

      // Create new offer
      const newOffer = await Offer.create({
        name,
        discountPercent,
        startDate,
        endDate,
        targetId,
        targetType,
        isActive: true
      });

      // Update the references in product or category
      const Model = targetType === 'product' ? ProductSchema : CategorySchema;
      await Model.findByIdAndUpdate(
        targetId,
        { $push: { offers: newOffer._id } }
      );

      res.status(201).json({
        success: true,
        message: 'Offer created successfully',
        offer: newOffer
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Edit offer
  editOffer: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const existingOffer = await Offer.findById(id);

      if (!existingOffer) {
        return res.status(404).json({
          success: false,
          message: 'Offer not found'
        });
      }

      // If changing target, update references
      if (updates.targetId && updates.targetId !== existingOffer.targetId.toString()) {
        // Remove offer from old target
        const OldModel = existingOffer.targetType === 'product' ? ProductSchema : CategorySchema;
        await OldModel.findByIdAndUpdate(
          existingOffer.targetId,
          { $pull: { offers: existingOffer._id } }
        );

        // Verify new target exists
        const targetExists = await checkTargetExists(updates.targetId, updates.targetType || existingOffer.targetType);
        if (!targetExists) {
          return res.status(404).json({
            success: false,
            message: `New ${updates.targetType || existingOffer.targetType} not found`
          });
        }

        // Add to new target
        const NewModel = (updates.targetType || existingOffer.targetType) === 'product' ? ProductSchema : CategorySchema;
        await NewModel.findByIdAndUpdate(
          updates.targetId,
          { $push: { offers: existingOffer._id } }
        );
      }

      // Validate discount percentage if it's being updated
      if (updates.discountPercent !== undefined) {
        if (updates.discountPercent < 0 || updates.discountPercent > 100) {
          return res.status(400).json({
            success: false,
            message: 'Discount percentage must be between 0 and 100'
          });
        }
      }

      const updatedOffer = await Offer.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: 'Offer updated successfully',
        offer: updatedOffer
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get all offers
  getAllOffers: async (req, res) => {
    try {
      const offers = await Offer.find()
        .populate({
          path: 'targetId',
          select: 'productName CategoryName', // These fields exist in respective schemas
          model: doc => doc.targetType === 'product' ? 'ProductSchema' : 'CategorySchema'
        });

      res.status(200).json({
        success: true,
        count: offers.length,
        offers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get active offers
  getActiveOffers: async (req, res) => {
    try {
      const currentDate = new Date();
      const offers = await Offer.find({
        isActive: true,
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate }
      }).populate({
        path: 'targetId',
        select: 'productName CategoryName',
        model: doc => doc.targetType === 'product' ? 'ProductSchema' : 'CategorySchema'
      });

      res.status(200).json({
        success: true,
        count: offers.length,
        offers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get offers by product
  getProductOffers: async (req, res) => {
    try {
      const { productId } = req.params;
      const currentDate = new Date();

      // First verify product exists
      const product = await ProductSchema.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const offers = await Offer.find({
        targetType: 'product',
        targetId: productId,
        isActive: true,
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate }
      });

      res.status(200).json({
        success: true,
        count: offers.length,
        offers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get offers by category
  getCategoryOffers: async (req, res) => {
    try {
      const { categoryId } = req.params;
      const currentDate = new Date();

      // First verify category exists
      const category = await CategorySchema.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      const offers = await Offer.find({
        targetType: 'category',
        targetId: categoryId,
        isActive: true,
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate }
      });

      res.status(200).json({
        success: true,
        count: offers.length,
        offers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  ,getOfferById: async (req, res) => {
    try {
        const { id } = req.params;
        const offer = await Offer.findById(id).populate({
            path: 'targetId',
            select: 'productName CategoryName',
            model: doc => doc.targetType === 'product' ? 'ProductSchema' : 'CategorySchema'
        });

        if (!offer) {
            return res.status(404).json({
                success: false,
                message: 'Offer not found'
            });
        }

        res.status(200).json({
            success: true,
            offer
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
},

// Toggle offer status
toggleOfferStatus: async (req, res) => {
    try {
        const { id } = req.params;
        const offer = await Offer.findById(id);

        if (!offer) {
            return res.status(404).json({
                success: false,
                message: 'Offer not found'
            });
        }

        offer.isActive = !offer.isActive;
        await offer.save();

        res.status(200).json({
            success: true,
            message: `Offer ${offer.isActive ? 'activated' : 'deactivated'} successfully`,
            offer
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
};

module.exports = offerController;