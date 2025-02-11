const Product = require('../model/productSchema');

const restoreProductStock = async (order) => {
    try {
        // Loop through each item in the order
        for (const item of order.items) {
            // Find the product
            const product = await Product.findById(item.product);
            
            if (!product) {
                console.error(`Product not found: ${item.product}`);
                continue;
            }

            // Find and update the specific size's stock
            await Product.findOneAndUpdate(
                { 
                    _id: item.product,
                    'sizes.size': item.size  // Match the specific size
                },
                {
                    $inc: {
                        'sizes.$.stock': item.quantity  // Increment stock for matched size
                    }
                }
            );
        }
    } catch (error) {
        console.error('Error restoring product stock:', error);
        throw error;
    }
};

module.exports = {restoreProductStock};