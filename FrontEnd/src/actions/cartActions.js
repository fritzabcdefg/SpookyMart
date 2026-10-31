
import axios from 'axios'
import {
    ADD_TO_CART,
    REMOVE_ITEM_CART,
    SAVE_SHIPPING_INFO,
    CLEAR_CART,
    LOAD_USER_CART
} from '../constants/cartConstants'

// Each account gets its own cart and shipping information.
const getCartKey = (state) => {
    const userId = state.auth?.user?._id
    return userId ? `cartItems_${userId}` : 'guest_cartItems'
}

const getShippingKey = (state) => {
    const userId = state.auth?.user?._id
    return userId ? `shippingInfo_${userId}` : 'guest_shippingInfo'
}

// Load the selected account's saved cart.
export const loadCartForUser = (userId) => async (dispatch) => {
    const cartItems = JSON.parse(
        localStorage.getItem(`cartItems_${userId}`) || '[]'
    )

    const shippingInfo = JSON.parse(
        localStorage.getItem(`shippingInfo_${userId}`) || '{}'
    )

    dispatch({
        type: LOAD_USER_CART,
        payload: { cartItems, shippingInfo }
    })
}

export const addItemToCart = (id, quantity) => async (dispatch, getState) => {
    const { data } = await axios.get(`${import.meta.env.VITE_API}/product/${id}`)

    dispatch({
        type: ADD_TO_CART,
        payload: {
            product: data.product._id,
            name: data.product.name,
            price: data.product.price,
            image: data.product.images[0].url,
            stock: data.product.stock,
            quantity
        }
    })

    localStorage.setItem(
        getCartKey(getState()),
        JSON.stringify(getState().cart.cartItems)
    )
}

export const removeItemFromCart = (id) => async (dispatch, getState) => {
    dispatch({
        type: REMOVE_ITEM_CART,
        payload: id
    })

    localStorage.setItem(
        getCartKey(getState()),
        JSON.stringify(getState().cart.cartItems)
    )
}

export const saveShippingInfo = (data) => async (dispatch, getState) => {
    dispatch({
        type: SAVE_SHIPPING_INFO,
        payload: data
    })

    localStorage.setItem(
        getShippingKey(getState()),
        JSON.stringify(data)
    )
}

// Clear the currently displayed cart without deleting the account's saved cart.
export const clearCart = () => async (dispatch) => {
    dispatch({ type: CLEAR_CART })
}
