
const express = require('express');
const router = express.Router();

const {
    getCart,
    syncCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    removePurchasedItems
} = require('../controllers/cart');

const { isAuthenticatedUser } = require('../middleware/auth');

// All cart routes require login.
router.get('/cart', isAuthenticatedUser, getCart);

router.post('/cart/sync', isAuthenticatedUser, syncCart);

router.put(
    '/cart/items/:productId',
    isAuthenticatedUser,
    updateCartItem
);

router.delete(
    '/cart/items/:productId',
    isAuthenticatedUser,
    removeCartItem
);

router.delete('/cart', isAuthenticatedUser, clearCart);
router.delete('/cart/purchased', isAuthenticatedUser, removePurchasedItems);

module.exports = router;
