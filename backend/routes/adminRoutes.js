const express = require('express');
const router = express.Router();
const {verifyAdmin} =require("../middleware/auth.js")
const { 
    fetchUserDetails, 
    adminLogout, 
    getUseryId, 
    blockUser, 
    unblockUser, 
    toggleUserBlock
} = require('../controller/adminController');
const { 
    createProduct, 
    getAllProducts, 
    getProductById, 
    updateProduct, 
    deleteProduct ,
    toggleProductActive
} = require('../controller/productController');
const { 
    createCategory, 
    getAllCategories, 
    getCategoryById, 
    updateCategory, 
    toggleCategoryStatus
} = require("../controller/categoryController.js");

const {updateOrderStatus,getAllOrderByAdmin,}=require("../controller/orderController.js")
const { 
    createOffer,
    editOffer,
    getAllOffers,
    getActiveOffers,
    getOfferById,
    getProductOffers,
    getCategoryOffers,
    toggleOfferStatus
} = require('../controller/offerController');

const {createCoupon,listCoupons,deleteCoupon,applyCoupon,validateCoupon} =require("../controller/couponController.js")




// User routes
router.get('/users',  fetchUserDetails);
router.get('/user/:userId', getUseryId);
router.post("/adminlogout",  adminLogout);
router.patch('/users/:userId/toggle-block', verifyAdmin, toggleUserBlock);
// Product routes


// Category routes
router.get('/categories',verifyAdmin, getAllCategories);
router.get('/categoryById/:id',verifyAdmin, getCategoryById);
router.post('/createcategory', verifyAdmin, createCategory);
router.put('/updatecategory/:id',verifyAdmin,  updateCategory);
router.put("/category/:categoryId/toggle-status",verifyAdmin,toggleCategoryStatus)
router.patch("/products/:id/toggle-status", verifyAdmin, toggleProductActive)


// Product routes

router.post('/createproduct',verifyAdmin, createProduct);
router.get('/getallproducts',verifyAdmin, getAllProducts);
router.get('/getproductbyid/:id',verifyAdmin, getProductById);
router.put('/updateproduct/:id',verifyAdmin,  updateProduct);
router.delete('/deleteproduct/:id',verifyAdmin,  deleteProduct);



// order routes;

router.get('/orders', verifyAdmin, getAllOrderByAdmin);
router.put('/orders/:orderId/status',verifyAdmin, updateOrderStatus);


// offer routes

router.post('/createoffer', verifyAdmin, createOffer);
router.put('/updateoffer/:id', verifyAdmin, editOffer);
router.get('/offers', verifyAdmin, getAllOffers);
router.get('/offers/active', verifyAdmin, getActiveOffers);
router.get('/offers/:id', verifyAdmin, getOfferById);
router.get('/offers/product/:productId', verifyAdmin, getProductOffers);
router.get('/offers/category/:categoryId', verifyAdmin, getCategoryOffers);
router.patch('/offers/:id/toggle-status', verifyAdmin, toggleOfferStatus);




// coupon routes  for admin

router.post("/create",verifyAdmin,createCoupon)
router.delete("/delete/:id",verifyAdmin,deleteCoupon)
router.get("/list",verifyAdmin,listCoupons)

module.exports = router;
