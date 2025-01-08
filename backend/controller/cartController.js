const Cart = require("../model/cartSchema")
const ProductSchema = require("../model/productSchema")
const CategorySchema= require("../model/categorySchema")
const addToCart = async(req,res)=>{
    try{
        console.log(req.user)
        const userId = req?.user?.data?.id 
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }
        const {productId,quantity,size}=req.body

        // Only check individual product quantity
        if(quantity > 5){
           return res.status(400).json({
            success:false,
            message:"Cannot Add more than 5 items of the same Product"
           })
        }

        const product = await ProductSchema.findById(productId)
        if(!product){
            return res.status(400).json({
                success:false,
                message:"Product not found"
            })
        }

        if(!product.isactive){
            return res.status(400).json({
                success:false,
                message:"this product is not available"
            })
        }

        const category= await  CategorySchema.findById(product.category)
        if(!category || !category.isactive){
            return res.status(400).json({
                success:false,
                message:"this category is currently not available"
            })
        }

        // Find available quantity for specific size
        const sizeInfo = product.availableSizes.find(s => s.size === size);
        if (!sizeInfo) {
            return res.status(400).json({
                success: false,
                message: "Selected size not available"
            });
        }

        // Check if requested quantity exceeds available stock for specific size
        if(quantity > sizeInfo.quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${sizeInfo.quantity} items available in stock for size ${size}`
            });
        }
        
        let cart = await Cart.findOne({user:userId})
        if(!cart){
            cart = new Cart({
                user:userId,
                items:[],
                totalAmount:0
            })
        }

        const price = product.salePrice;
        const discountedPrice = price-(price*(product.discountPercent/100));

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.product.toString() === productId && item.size === size
        );

        if (existingItemIndex > -1) {
           const newQuantity = cart.items[existingItemIndex].quantity + quantity;
           if(newQuantity > 5){
                return res.status(400).json({
                    success:false,
                    message: "Total quantity cannot exceed 5 items for the same product and size"
                })
           }
           // Check if total quantity exceeds available stock for specific size
           if(newQuantity > sizeInfo.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${sizeInfo.quantity} items available in stock for size ${size}`
                });
           }
           cart.items[existingItemIndex].quantity = newQuantity;
        } else {
            cart.items.push({
                product: productId,
                quantity,
                size,
                price,
                discountedPrice
            });
        }

        // Recalculate total amount
        cart.totalAmount = cart.items.reduce((total, item) => {
            return total + (item.discountedPrice * item.quantity);
        }, 0);

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Item added to cart successfully",
            cart
        });
    }
    catch(error){
        console.log("Add to cart:",error)
        return res.status(500).json({
            success:false,
            message:"Error in adding to cart",
            error:error.message
        })
    }
}

// Rest of the controller functions remain the same
const getCartItems = async(req,res)=>{
    try{
        const userId = req.user.data.id
        console.log(userId)
        const cart = await Cart.findOne({user:userId})
        .populate({
            path: 'items.product',
            select: 'productName  images description status',
            match: { isactive: true }
        })
        if(!cart){
            return res.status(404).json({
                success:false,
                message:"Cart is empty ",
                cart:{
                    items:[],
                    totalAmount:0
                }
            })
        }
        cart.items = cart.items.filter(item => item.product !== null);
        return res.status(200).json({
            success:true,
            message:"Cart items fetched successfully",
            cart
        })

    }
    catch(error){
        console.log("Get cart items:",error)
        return res.status(500).json({
            success:false,
            message:"Error in getting cart items",
        })
    }
}

const updateCartItem = async (req, res) => {
    try {
        const { productId, quantity, size } = req.body;
        const userId = req.user.data.id;

        // Only validate individual product quantity
        if (quantity > 5) {
            return res.status(400).json({
                success: false,
                message: "Quantity cannot exceed 5 items"
            });
        }

        const product = await ProductSchema.findById(productId);
        if (!product) {
            return res.status(400).json({
                success: false,
                message: "Product not found"
            });
        }

        // Find available quantity for specific size
        const sizeInfo = product.availableSizes.find(s => s.size === size);
        if (!sizeInfo) {
            return res.status(400).json({
                success: false,
                message: "Selected size not available"
            });
        }

        // Check if requested quantity exceeds available stock for specific size
        if(quantity > sizeInfo.quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${sizeInfo.quantity} items available in stock for size ${size}`
            });
        }

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId && item.size === size
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Item not found in cart"
            });
        }

        cart.items[itemIndex].quantity = quantity;
        cart.totalAmount = cart.items.reduce((total, item) => {
            return total + (item.discountedPrice * item.quantity);
        }, 0);

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Cart item updated successfully",
            cart
        });

    } catch (error) {
        console.error('Update cart item error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

const removeCartItems = async(req,res)=>{
    try{
        const {productId,size}=req.body
        const userId = req.user.data.id

        const cart = await Cart.findOne({user:userId})
        if(!cart){
            return res.status(404).json({
                success:false,
                message:"Cart is empty ",
            })
        }
        cart.items=cart.items.filter(
            item=>!(item.product.toString() === productId && item.size===size)
        )
        cart.totalAmount = cart.items.reduce((total, item) => {
            return total + (item.discountedPrice * item.quantity);
        }, 0);

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Item removed from cart successfully",
            cart
        });

    }
    catch(error){
        console.log("Remove cart items:",error)
        return res.status(400).json({
            success:false,
            messsage:"Cart not found"
        })
    }
}

const clearCart = async(req,res)=>{
    try{
        const userId = req.user.data.id
        const cart = await Cart.findOne({user:userId})
        if(!cart){
            return res.status(404).json({
                success:false,
                message:"Cart is empty ",
            })
        }
        cart.items=[]
        cart.totalAmount=0
        await cart.save()
        return res.status(200).json({
            success: true,
            message: "Cart cleared successfully",
        })
    }
    catch(error){
        console.log("Clear cart:",error)
        return res.status(500).json({
            success:false,
            message:"internal server error",
            error:error.message
        })
    }
}

module.exports={
    addToCart,
    getCartItems,
    clearCart,
    removeCartItems,
    updateCartItem
}