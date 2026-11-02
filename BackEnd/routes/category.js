const express=require('express');
const router=express.Router();
const {getCategories,getAdminCategories,createCategory,updateCategory,deleteCategory}=require('../controllers/category');
const {isAuthenticatedUser,authorizeRoles}=require('../middleware/auth');
router.get('/categories',getCategories);
router.route('/admin/categories').get(isAuthenticatedUser,authorizeRoles('admin'),getAdminCategories).post(isAuthenticatedUser,authorizeRoles('admin'),createCategory);
router.route('/admin/category/:id').put(isAuthenticatedUser,authorizeRoles('admin'),updateCategory).delete(isAuthenticatedUser,authorizeRoles('admin'),deleteCategory);
module.exports=router;