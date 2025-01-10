const ProductSchema = require('../../model/productSchema');
const Offer = require('../../model/offerSchema');
const mongoose = require('mongoose');

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const calculateDiscountAmount = (price, offer) => {
  if (!offer || typeof price !== 'number' || price < 0) {
    throw new Error('Invalid input for discount calculation');
  }

  let discount = 0;
  if (offer.offerType === 'percentage') {
    if (offer.value < 0 || offer.value > 100) {
      throw new Error('Invalid percentage discount value');
    }
    discount = (price * offer.value) / 100;
  } else if (offer.offerType === 'flatAmount') {
    if (offer.value < 0) {
      throw new Error('Invalid flat discount value');
    }
    discount = Math.min(offer.value, price); // Ensure discount doesn't exceed price
  } else {
    throw new Error('Invalid offer type');
  }
  
  // Apply maximum discount if specified
  if (offer.maximumDiscount && offer.maximumDiscount > 0) {
    discount = Math.min(discount, offer.maximumDiscount);
  }
  
  return Number(discount.toFixed(2)); // Round to 2 decimal places
};

const calculateFinalPrice = async (productId) => {
  try {
    if (!isValidObjectId(productId)) {
      throw new Error('Invalid product ID format');
    }

    // Fetch product with its offers
    const product = await ProductSchema.findById(productId)
      .populate('offers')
      .populate({
        path: 'category',
        populate: { path: 'offers' }
      });

    if (!product) {
      throw new Error('Product not found');
    }

    const salePrice = product.salePrice;
    if (typeof salePrice !== 'number' || salePrice < 0) {
      throw new Error('Invalid product sale price');
    }

    let finalPrice = salePrice;
    const appliedOffers = [];
    
    // Combine product and category offers
    const allOffers = [
      ...(product.offers || []),
      ...(product.category?.offers || [])
    ].filter(Boolean); // Remove any null/undefined offers

    // Filter active offers
    const currentDate = new Date();
    const activeOffers = allOffers.filter(offer => 
      offer.isActive && 
      currentDate >= offer.startDate && 
      currentDate <= offer.endDate &&
      (offer.minimumPurchase === 0 || salePrice >= offer.minimumPurchase)
    );

    // Apply stackable offers first
    const stackableOffers = activeOffers.filter(offer => offer.stackable);
    for (const offer of stackableOffers) {
      const discountAmount = calculateDiscountAmount(finalPrice, offer);
      finalPrice -= discountAmount;
      
      appliedOffers.push({
        offerId: offer._id,
        name: offer.name,
        type: offer.offerType,
        value: offer.value,
        discountAmount: Number(discountAmount.toFixed(2))
      });
    }

    // Find best non-stackable offer
    const nonStackableOffers = activeOffers.filter(offer => !offer.stackable);
    if (nonStackableOffers.length > 0) {
      const pricesAfterOffers = nonStackableOffers.map(offer => {
        const priceAfterOffer = salePrice - calculateDiscountAmount(salePrice, offer);
        return { offer, price: priceAfterOffer };
      });

      const bestOffer = pricesAfterOffers.reduce((best, current) => 
        current.price < best.price ? current : best
      , pricesAfterOffers[0]);

      const priceWithBestNonStackable = bestOffer.price;
      
      // Take the lower price between stackable offers and best non-stackable offer
      finalPrice = Math.min(finalPrice, priceWithBestNonStackable);
      
      if (priceWithBestNonStackable < finalPrice) {
        appliedOffers.length = 0; // Clear stackable offers if non-stackable is better
        appliedOffers.push({
          offerId: bestOffer.offer._id,
          name: bestOffer.offer.name,
          type: bestOffer.offer.offerType,
          value: bestOffer.offer.value,
          discountAmount: Number((salePrice - priceWithBestNonStackable).toFixed(2))
        });
      }
    }

    // Ensure final price is not negative
    finalPrice = Math.max(0, Number(finalPrice.toFixed(2)));
    const totalDiscount = Number((salePrice - finalPrice).toFixed(2));

    return {
      regularPrice: product.regularPrice,
      salePrice: salePrice,
      finalPrice: finalPrice,
      totalDiscount: totalDiscount,
      discountPercentage: Number(((totalDiscount / salePrice) * 100).toFixed(2)),
      appliedOffers
    };
  } catch (error) {
    throw new Error(`Price calculation failed: ${error.message}`);
  }
};

module.exports = {
  calculateFinalPrice,
  calculateDiscountAmount
};