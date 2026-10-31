const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');

const {
    newProduct,
    getSingleProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    bulkDeleteProducts,
    restoreProduct,
    getAdminProducts,
    createProductReview,
    updateProductReview,
    getProductReviews,
    getMyProductReview,
    deleteReview,
    productSales
} = require('../controllers/product');

const {
    isAuthenticatedUser,
    authorizeRoles
} = require('../middleware/auth');

// ADMIN PRODUCT ROUTES
router.post(
    '/admin/product/new',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    upload.array('images', 10),
    newProduct
);

router.put(
    '/admin/product/:id',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    upload.array('images', 10),
    updateProduct
);

router.delete(
    '/admin/product/:id',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    deleteProduct
);

router.delete(
    '/admin/products/bulk-delete',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    bulkDeleteProducts
);

router.put(
    '/admin/product/:id/restore',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    restoreProduct
);

router.get(
    '/admin/products',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getAdminProducts
);

// PUBLIC PRODUCT ROUTES
router.get('/product/:id', getSingleProduct);
router.get('/products', getProducts);

// PRODUCT REVIEW ROUTES
router.put('/review', isAuthenticatedUser, createProductReview);
router.put('/review/update', isAuthenticatedUser, updateProductReview);
router.get('/review/my/:productId', isAuthenticatedUser, getMyProductReview);
router.get('/reviews', getProductReviews);

router.delete(
    '/reviews',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    deleteReview
);

// PRODUCT SALES
router.get('/admin/product-sales', productSales);

module.exports = router;