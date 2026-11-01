
import axios from 'axios';

import {
    ADD_TO_CART,
    REMOVE_ITEM_CART,
    SAVE_SHIPPING_INFO,
    CLEAR_CART,
    LOAD_USER_CART
} from '../constants/cartConstants';

const API = import.meta.env.VITE_API;

// Each account gets its own cart and shipping information.
const getCartKey = (userId) => {
    return userId ? `cartItems_${userId}` : 'guest_cartItems';
};

const getShippingKey = (userId) => {
    return userId ? `shippingInfo_${userId}` : 'guest_shippingInfo';
};

// Safely read JSON from localStorage.
const readStorage = (key, fallback) => {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        console.error(`Could not read ${key} from localStorage:`, error);
        return fallback;
    }
};

// Save the current cart as a local backup.
const saveLocalCart = (userId, cartItems) => {
    localStorage.setItem(
        getCartKey(userId),
        JSON.stringify(cartItems)
    );
};

// Load the logged-in user's cart from MongoDB.
// Guest cart items are merged only once, then removed from guest storage.
export const loadCartForUser = (userId) => async (dispatch) => {
    const accountCart = readStorage(
        getCartKey(userId),
        []
    );

    const guestCart = readStorage(
        'guest_cartItems',
        []
    );

    const accountShipping = readStorage(
        getShippingKey(userId),
        null
    );

    const guestShipping = readStorage(
        'guest_shippingInfo',
        {}
    );

    const shippingInfo = accountShipping || guestShipping || {};

    try {
        let response;

        if (Array.isArray(guestCart) && guestCart.length > 0) {
            // Merge guest items into the MongoDB cart.
            response = await axios.post(
                `${API}/cart/sync`,
                { items: guestCart.map(item => ({
                    product: item.product,
                    quantity: Number(item.quantity)
                })) },
                { withCredentials: true }
            );

            // Remove guest cart only after successful synchronization.
            localStorage.removeItem('guest_cartItems');
        } else {
            // No guest cart to merge; retrieve the saved database cart.
            response = await axios.get(
                `${API}/cart`,
                { withCredentials: true }
            );
        }

        const cartItems = response.data.cartItems || [];

        dispatch({
            type: LOAD_USER_CART,
            payload: {
                cartItems,
                shippingInfo
            }
        });

        saveLocalCart(userId, cartItems);

        // Move guest shipping details to this account if no account
        // shipping details have been saved yet.
        if (!accountShipping && Object.keys(guestShipping).length > 0) {
            localStorage.setItem(
                getShippingKey(userId),
                JSON.stringify(guestShipping)
            );

            localStorage.removeItem('guest_shippingInfo');
        }

    } catch (error) {
        console.error(
            'Could not load the MongoDB cart:',
            error.response?.data || error.message
        );

        // Keep the existing local cart available if the server is offline.
        dispatch({
            type: LOAD_USER_CART,
            payload: {
                cartItems: accountCart,
                shippingInfo
            }
        });
    }
};

// Add a product or change its quantity.
export const addItemToCart = (id, quantity) => async (dispatch, getState) => {
    const userId = getState().auth?.user?._id;

    if (userId) {
        // Logged-in users save changes directly to MongoDB.
        const { data } = await axios.put(
            `${API}/cart/items/${id}`,
            { quantity: Number(quantity) },
            { withCredentials: true }
        );

        const shippingInfo = getState().cart.shippingInfo || {};

        dispatch({
            type: LOAD_USER_CART,
            payload: {
                cartItems: data.cartItems || [],
                shippingInfo
            }
        });

        saveLocalCart(userId, data.cartItems || []);
        return;
    }

    // Guests continue using the existing local cart.
    const { data } = await axios.get(`${API}/product/${id}`);

    dispatch({
        type: ADD_TO_CART,
        payload: {
            product: data.product._id,
            name: data.product.name,
            price: data.product.price,
            image: data.product.images?.[0]?.url || '',
            stock: data.product.stock,
            quantity: Number(quantity)
        }
    });

    saveLocalCart(
        null,
        getState().cart.cartItems
    );
};

// Remove one product.
export const removeItemFromCart = (id) => async (dispatch, getState) => {
    const userId = getState().auth?.user?._id;

    if (userId) {
        const { data } = await axios.delete(
            `${API}/cart/items/${id}`,
            { withCredentials: true }
        );

        const shippingInfo = getState().cart.shippingInfo || {};

        dispatch({
            type: LOAD_USER_CART,
            payload: {
                cartItems: data.cartItems || [],
                shippingInfo
            }
        });

        saveLocalCart(userId, data.cartItems || []);
        return;
    }

    dispatch({
        type: REMOVE_ITEM_CART,
        payload: id
    });

    saveLocalCart(
        null,
        getState().cart.cartItems
    );
};

// Save shipping information separately for each account.
export const saveShippingInfo = (data) => async (dispatch, getState) => {
    dispatch({
        type: SAVE_SHIPPING_INFO,
        payload: data
    });

    const userId = getState().auth?.user?._id;

    localStorage.setItem(
        getShippingKey(userId),
        JSON.stringify(data)
    );
};

// Clear only the currently displayed Redux cart.
// This does not delete the MongoDB cart when the user logs out.
export const clearCart = () => async (dispatch) => {
    dispatch({ type: CLEAR_CART });
};
export const removePurchasedItemsFromCart = (productIds) => async (dispatch, getState) => {
    const userId = getState().auth?.user?._id;

    if (userId) {
        const { data } = await axios.delete(
            `${API}/cart/purchased`,
            {
                data: { productIds },
                withCredentials: true
            }
        );

        const shippingInfo = getState().cart.shippingInfo || {};

        dispatch({
            type: LOAD_USER_CART,
            payload: {
                cartItems: data.cartItems || [],
                shippingInfo
            }
        });

        saveLocalCart(userId, data.cartItems || []);
        return;
    }

    const currentItems = getState().cart.cartItems || [];
    const remainingItems = currentItems.filter(
        item => !productIds.includes(item.product)
    );

    dispatch({
        type: LOAD_USER_CART,
        payload: {
            cartItems: remainingItems,
            shippingInfo: getState().cart.shippingInfo || {}
        }
    });

    saveLocalCart(null, remainingItems);
};
