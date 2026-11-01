
const express = require('express');
const router = express.Router();

const {
    getCustomer,
    updateCustomer,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod
} = require('../controllers/customer');

const { isAuthenticatedUser } = require('../middleware/auth');

// Customer profile
router.get('/customer/me', isAuthenticatedUser, getCustomer);
router.put('/customer/me', isAuthenticatedUser, updateCustomer);

// Shipping addresses
router.post('/customer/me/addresses', isAuthenticatedUser, addAddress);
router.put('/customer/me/addresses/:addressId', isAuthenticatedUser, updateAddress);
router.delete('/customer/me/addresses/:addressId', isAuthenticatedUser, deleteAddress);
router.put('/customer/me/addresses/:addressId/default', isAuthenticatedUser, setDefaultAddress);

// Saved payment methods
router.post('/customer/me/payment-methods', isAuthenticatedUser, addPaymentMethod);
router.delete('/customer/me/payment-methods/:paymentMethodId', isAuthenticatedUser, deletePaymentMethod);
router.put('/customer/me/payment-methods/:paymentMethodId/default', isAuthenticatedUser, setDefaultPaymentMethod);

module.exports = router;
