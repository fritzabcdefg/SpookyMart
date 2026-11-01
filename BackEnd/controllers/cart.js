
const mongoose = require('mongoose');
const Cart = require('../models/cart');
const Product = require('../models/product');

// Return cart items in the same general format used by the frontend.
const getFormattedCart = async (userId) => {
    const cart = await Cart.findOne({ user: userId })
        .populate('items.product');

    if (!cart) {
        return [];
    }

    return cart.items
        .filter(item => item.product && !item.product.isDeleted)
        .map(item => ({
            product: item.product._id,
            name: item.product.name,
            price: item.product.price,
            image: item.product.images?.[0]?.url || '',
            stock: item.product.stock,
            quantity: item.quantity
        }));
};

// GET /api/v1/cart
exports.getCart = async (req, res) => {
    try {
        const cartItems = await getFormattedCart(req.user._id);

        return res.status(200).json({
            success: true,
            cartItems
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// POST /api/v1/cart/sync
// Merge guest cart items with the customer's existing database cart.
exports.syncCart = async (req, res) => {
    try {
        const { items } = req.body;

        if (!Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: 'Cart items must be an array.'
            });
        }

        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = new Cart({
                user: req.user._id,
                items: []
            });
        }

        // Start with the items already saved in MongoDB.
        const quantities = new Map();

        cart.items.forEach(item => {
            const productId = item.product.toString();

            quantities.set(
                productId,
                (quantities.get(productId) || 0) + item.quantity
            );
        });

        // Add guest cart quantities to the saved cart.
        for (const item of items) {
            if (
                !item.product ||
                !mongoose.Types.ObjectId.isValid(item.product) ||
                !Number.isInteger(Number(item.quantity)) ||
                Number(item.quantity) < 1
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product or quantity in cart.'
                });
            }

            const productId = item.product.toString();

            quantities.set(
                productId,
                (quantities.get(productId) || 0) + Number(item.quantity)
            );
        }

        const productIds = [...quantities.keys()];

        const products = await Product.find({
            _id: { $in: productIds },
            isDeleted: { $ne: true }
        });

        const productMap = new Map(
            products.map(product => [
                product._id.toString(),
                product
            ])
        );

        const updatedItems = [];

        for (const [productId, requestedQuantity] of quantities) {
            const product = productMap.get(productId);

            // Ignore products that no longer exist or are deleted.
            if (!product) {
                continue;
            }

            if (product.stock < 1) {
                continue;
            }

            // Never allow the saved quantity to exceed available stock.
            const quantity = Math.min(
                requestedQuantity,
                product.stock
            );

            updatedItems.push({
                product: product._id,
                quantity
            });
        }

        cart.items = updatedItems;
        await cart.save();

        const cartItems = await getFormattedCart(req.user._id);

        return res.status(200).json({
            success: true,
            message: 'Cart synchronized successfully.',
            cartItems
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// PUT /api/v1/cart/items/:productId
// Add a product or update its quantity.
exports.updateCartItem = async (req, res) => {
    try {
        const { productId } = req.params;
        const quantity = Number(req.body.quantity);

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID.'
            });
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be a positive whole number.'
            });
        }

        const product = await Product.findOne({
            _id: productId,
            isDeleted: { $ne: true }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found.'
            });
        }

        if (quantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} item(s) are available.`
            });
        }

        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = new Cart({
                user: req.user._id,
                items: []
            });
        }

        const existingItem = cart.items.find(
            item => item.product.toString() === productId
        );

        if (existingItem) {
            existingItem.quantity = quantity;
        } else {
            cart.items.push({
                product: product._id,
                quantity
            });
        }

        await cart.save();

        const cartItems = await getFormattedCart(req.user._id);

        return res.status(200).json({
            success: true,
            message: 'Cart updated successfully.',
            cartItems
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// DELETE /api/v1/cart/items/:productId
exports.removeCartItem = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID.'
            });
        }

        const cart = await Cart.findOne({ user: req.user._id });

        if (cart) {
            cart.items = cart.items.filter(
                item => item.product.toString() !== productId
            );

            await cart.save();
        }

        const cartItems = await getFormattedCart(req.user._id);

        return res.status(200).json({
            success: true,
            message: 'Item removed from cart.',
            cartItems
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// DELETE /api/v1/cart
exports.clearCart = async (req, res) => {
    try {
        await Cart.findOneAndUpdate(
            { user: req.user._id },
            { $set: { items: [] } }
        );

        return res.status(200).json({
            success: true,
            message: 'Cart cleared successfully.',
            cartItems: []
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.removePurchasedItems = async (req, res) => {
    try {
        const { productIds } = req.body;

        if (!Array.isArray(productIds)) {
            return res.status(400).json({
                success: false,
                message: 'Product IDs must be an array.'
            });
        }

        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(200).json({
                success: true,
                message: 'Cart is already empty.',
                cartItems: []
            });
        }

        cart.items = cart.items.filter(
            item => !productIds.includes(item.product.toString())
        );

        await cart.save();

        const cartItems = await getFormattedCart(req.user._id);

        return res.status(200).json({
            success: true,
            message: 'Purchased items removed successfully.',
            cartItems
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};