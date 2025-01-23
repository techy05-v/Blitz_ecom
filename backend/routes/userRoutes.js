
const express= require("express")
const userRoute = express.Router()
const {googleAuth,getProductById,getAllProductsByUser,getAllCategories,resetPassword,forgotPassword} = require("../controller/userController")
const {verifyUser} = require("../middleware/auth")
const {addAddress,editAddress,deleteAddress,getAddresses}= require("../controller/addressController")
const{addToCart,getCartItems ,clearCart ,removeCartItems,updateCartItem }=require("../controller/cartController")
const{createOrder,getUserOrders,cancelOrder,getOrderDetails,cancelOrderItem,verifyPayment}=require("../controller/orderController")
const { createProfile, getProfile, updateProfile, deleteProfileImage } = require("../controller/profileController");
const {addToWishlist,getWishlist,clearWishlist,removeFromWishlist,}= require("../controller/wishlistController")
const {
    getActiveOffers,
    getProductOffers,
    getCategoryOffers,
} = require('../controller/offerController');
const {applyCoupon,listCoupons} =require("../controller/couponController")
const {requestReturn} = require("../controller/returnController")
const {downloadInvoice} = require("../config/invoice")
const {getWalletDetails,useWalletBalance} = require("../controller/walletController")
userRoute.post("/google",googleAuth)
userRoute.get("/product/:id", verifyUser,getProductById)
userRoute.get("/products",verifyUser,getAllProductsByUser)
userRoute.get("/categories",verifyUser,getAllCategories)
userRoute.post("/forgotPassword",forgotPassword)
userRoute.post("/reset-password/:token",resetPassword)

// adress routes
userRoute.post("/addAddress",verifyUser,addAddress)
userRoute.put("/editAddress/:id",verifyUser,editAddress)
userRoute.delete("/deleteaddress/:id",verifyUser,deleteAddress)
userRoute.get("/getalladdress",verifyUser,getAddresses)


//cart routes

userRoute.post("/cart/add",verifyUser,addToCart)
userRoute.get("/cart",verifyUser,getCartItems)
userRoute.delete("/cart/remove",verifyUser,removeCartItems)
userRoute.delete("/cart/clear",verifyUser,clearCart)
userRoute.put("/cart/update",verifyUser,updateCartItem)
module.exports =userRoute


// order routes


userRoute.post("/order/create",verifyUser,createOrder)
userRoute.get("/orders/my-orders",verifyUser,getUserOrders)
userRoute.get("/orders/details/:orderId",verifyUser,getOrderDetails)
userRoute.put("/orders/cancel/:orderId",verifyUser,cancelOrder)
userRoute.post("/orders/:orderId/items/:itemId/cancel",verifyUser,cancelOrderItem)
userRoute.post("/verify-payment",verifyUser,verifyPayment)



userRoute.post("/profile/create", verifyUser, createProfile);
userRoute.get("/profileget", verifyUser, getProfile); 
userRoute.put("/profile", verifyUser, updateProfile);
userRoute.delete("/profile/image", verifyUser, deleteProfileImage)



// wishlist


userRoute.post("/add",verifyUser,addToWishlist);
userRoute.delete("/remove/:productId",verifyUser,removeFromWishlist)
userRoute.get("/getwishlist",verifyUser,getWishlist)
userRoute.delete("/clearwishlist",verifyUser,clearWishlist);

// user-offer
userRoute.get('/offers/active', verifyUser, getActiveOffers);
userRoute.get('/offers/product/:productId', verifyUser, getProductOffers);
userRoute.get('/offers/category/:categoryId', verifyUser, getCategoryOffers);

userRoute.post("/coupons/apply",verifyUser,applyCoupon)
userRoute.get("/coupons/list",verifyUser,listCoupons)

// return

userRoute.post("/return/request",verifyUser,requestReturn)


// wallet 

userRoute.get('/wallet/details', verifyUser, getWalletDetails);
userRoute.post('/wallet/use', useWalletBalance);

userRoute.get("/orders/:orderId/invoice",verifyUser,downloadInvoice)
