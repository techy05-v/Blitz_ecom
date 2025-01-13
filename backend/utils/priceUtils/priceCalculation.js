// priceCalculation.js
const ProductSchema = require("../../model/productSchema");
const Offer = require("../../model/offerSchema");

const calculateBestDiscount = async (product, currentDate = new Date()) => {
  if (!product) {
    throw new Error('Product is required');
  }

  console.log('Calculating best discount for product:', product._id);
  console.log('Current product discount:', product.discountPercent);
  console.log('Product category:', product.category);

  let bestDiscount = 0;

  try {
    // Find active product-specific offers
    const productOffers = await Offer.find({
      targetType: 'product',
      targetId: product._id,
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    }).lean();

    console.log('Found product offers:', JSON.stringify(productOffers, null, 2));

    // Find active category offers - modified to use proper category ID
    const categoryOffers = await Offer.find({
      targetType: 'category',
      targetId: product.category._id,
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    }).lean();

    // Also check embedded category offers for backward compatibility
    if (product.category.offers && Array.isArray(product.category.offers)) {
      const embeddedCategoryOffers = product.category.offers.filter(offer => 
        offer.isActive &&
        offer.targetType === 'category' &&
        new Date(offer.startDate) <= currentDate &&
        new Date(offer.endDate) >= currentDate
      );
      categoryOffers.push(...embeddedCategoryOffers);
    }

    console.log('Found category offers:', JSON.stringify(categoryOffers, null, 2));

    // Process product offers
    for (const offer of productOffers) {
      console.log('Processing product offer:', offer);
      if (offer.discountPercent > bestDiscount) {
        bestDiscount = offer.discountPercent;
        console.log('Updated best discount from product offer to:', bestDiscount);
      }
    }

    // Process category offers
    for (const offer of categoryOffers) {
      console.log('Processing category offer:', offer);
      if (offer.discountPercent > bestDiscount) {
        bestDiscount = offer.discountPercent;
        console.log('Updated best discount from category offer to:', bestDiscount);
      }
    }

    console.log('Final calculated best discount:', bestDiscount);
    return bestDiscount;

  } catch (error) {
    console.error('Error in calculateBestDiscount:', error);
    throw error;
  }
};

const calculateSalePrice = (regularPrice, discountPercent) => {
  if (typeof regularPrice !== 'number' || regularPrice < 0) {
    throw new Error('Regular price must be a non-negative number');
  }
  
  if (typeof discountPercent !== 'number' || discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount percentage must be between 0 and 100');
  }

  const calculatedPrice = Math.max(
    Math.round(regularPrice * (1 - discountPercent / 100)),
    1
  );
  
  return calculatedPrice;
};

const updateProductPrices = async (productId) => {
  try {
    console.log('Updating prices for product:', productId);

    // Get the product with category populated
    const product = await ProductSchema.findById(productId)
      .populate({
        path: 'category',
        select: '_id CategoryName offers'
      });
    
    if (!product) {
      throw new Error('Product not found');
    }

    console.log('Found product:', {
      _id: product._id,
      category: product.category._id,
      regularPrice: product.regularPrice,
      currentDiscountPercent: product.discountPercent
    });

    // Calculate best discount directly using the product
    const bestDiscount = await calculateBestDiscount(product);
    console.log('Calculated best discount:', bestDiscount);

    // Calculate new sale price
    const newSalePrice = calculateSalePrice(product.regularPrice, bestDiscount);
    console.log('Calculated new sale price:', newSalePrice);

    // Update the product with new values
    const updatedProduct = await ProductSchema.findByIdAndUpdate(
      productId,
      {
        $set: {
          discountPercent: bestDiscount,
          salePrice: newSalePrice
        }
      },
      { 
        new: true,
        runValidators: true
      }
    );

    console.log('Updated product values:', {
      discountPercent: updatedProduct.discountPercent,
      salePrice: updatedProduct.salePrice
    });

    return updatedProduct;

  } catch (error) {
    console.error('Error in updateProductPrices:', error);
    throw error;
  }
};

module.exports = {
  calculateBestDiscount,
  calculateSalePrice,
  updateProductPrices
};