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
    deleteCategory ,
    toggleCategoryStatus
} = require("../controller/categoryController.js");

const {updateOrderStatus,getAllOrderByAdmin,}=require("../controller/orderController.js")

// Admin login route
// router.post("/signin", adminSignIn);

// User routes
router.get('/users',  fetchUserDetails);
router.get('/user/:userId', getUseryId);
router.post("/adminlogout",  adminLogout);
// router.patch('/block-user/:userId',verifyAdmin,  blockUser);
// router.patch('/unblock-user/:userId',verifyAdmin, unblockUser);
// Single route to handle both blocking and unblocking
router.patch('/users/:userId/toggle-block', verifyAdmin, toggleUserBlock);
// Product routes


// Category routes
router.get('/categories',verifyAdmin, getAllCategories);
router.get('/categoryById/:id',verifyAdmin, getCategoryById);
router.post('/createcategory', verifyAdmin, createCategory);
router.put('/updatecategory/:id',verifyAdmin,  updateCategory);
// router.delete('/deletecategory/:id',verifyAdmin, deleteCategory);
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

module.exports = router;