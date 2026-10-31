
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import MetaData from '../Layout/MetaData';
import { addItemToCart, removeItemFromCart } from '../../actions/cartActions';

const Cart = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { cartItems = [] } = useSelector(state => state.cart || {});

    const [selectedIds, setSelectedIds] = useState(
        () => cartItems.map(item => item.product)
    );

    // Automatically select newly added cart items.
    useEffect(() => {
        setSelectedIds(previous => {
            const existingIds = cartItems.map(item => item.product);
            const validIds = previous.filter(id => existingIds.includes(id));
            const newIds = existingIds.filter(id => !validIds.includes(id));

            return [...validIds, ...newIds];
        });
    }, [cartItems]);

    const formatPrice = price =>
        new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(Number(price) || 0);

    const selectedItems = cartItems.filter(item =>
        selectedIds.includes(item.product)
    );

    const selectedQuantity = selectedItems.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
    );

    const selectedSubtotal = selectedItems.reduce(
        (total, item) =>
            total + Number(item.price) * Number(item.quantity),
        0
    );

    const totalItems = cartItems.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
    );

    const allSelected =
        cartItems.length > 0 && selectedIds.length === cartItems.length;

    const toggleItem = id => {
        setSelectedIds(previous =>
            previous.includes(id)
                ? previous.filter(itemId => itemId !== id)
                : [...previous, id]
        );
    };

    const toggleSelectAll = () => {
        setSelectedIds(
            allSelected ? [] : cartItems.map(item => item.product)
        );
    };

    const increaseQty = (id, quantity, stock) => {
        if (quantity >= stock) return;
        dispatch(addItemToCart(id, quantity + 1));
    };

    const decreaseQty = (id, quantity) => {
        if (quantity <= 1) return;
        dispatch(addItemToCart(id, quantity - 1));
    };

    const removeCartItemHandler = id => {
        dispatch(removeItemFromCart(id));
        setSelectedIds(previous => previous.filter(itemId => itemId !== id));
    };

    const bulkRemoveHandler = () => {
        if (selectedIds.length === 0) return;

        selectedIds.forEach(id => {
            dispatch(removeItemFromCart(id));
        });

        setSelectedIds([]);
    };

    const checkoutHandler = () => {
        const itemsForCheckout = cartItems.filter(item =>
            selectedIds.some(id => String(id) === String(item.product))
        );

        console.log('Selected IDs:', selectedIds);
        console.log('Items being checked out:', itemsForCheckout);
        console.log('Total selected:', itemsForCheckout.length);

        if (itemsForCheckout.length === 0) return;

        sessionStorage.setItem(
            'checkoutItems',
            JSON.stringify(itemsForCheckout)
        );

        navigate('/login?redirect=shipping');
    };

    return (
        <>
            <MetaData title="Shopping Cart - SpookyMart" />

            <div className="container spooky-cart-page">
                <div className="cart-page-heading">
                    <h1>Shopping Cart</h1>
                    <p>Choose the spooky finds you want to purchase.</p>
                </div>

                {cartItems.length === 0 ? (
                    <div className="cart-empty-state">
                        <div className="cart-empty-icon">🛒</div>
                        <h2>Your Cart is Empty</h2>
                        <p>Looks like you haven't added anything yet.</p>

                        <Link to="/products" className="cart-continue-btn">
                            Explore Products
                        </Link>
                    </div>
                ) : (
                    <div className="row">
                        <div className="col-12 col-lg-8">
                            <div className="cart-items-heading">
                                <h3>Your Items</h3>
                                <span>{totalItems} item(s)</span>
                            </div>

                            <div className="cart-selection-toolbar">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleSelectAll}
                                    />
                                    <span>
                                        {allSelected ? 'Deselect All' : 'Select All'}
                                    </span>
                                </label>

                                <button
                                    type="button"
                                    onClick={bulkRemoveHandler}
                                    disabled={selectedIds.length === 0}
                                    className="cart-bulk-remove"
                                >
                                    Remove Selected ({selectedIds.length})
                                </button>
                            </div>

                            {cartItems.map(item => (
                                <div
                                    className={`spooky-cart-item ${
                                        selectedIds.includes(item.product)
                                            ? 'cart-item-selected'
                                            : ''
                                    }`}
                                    key={item.product}
                                >
                                    <div className="cart-item-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(item.product)}
                                            onChange={() => toggleItem(item.product)}
                                            aria-label={`Select ${item.name}`}
                                        />
                                    </div>

                                    <div className="cart-product-image">
                                        <Link to={`/product/${item.product}`}>
                                            <img
                                                src={item.image || '/images/default_product.png'}
                                                alt={item.name}
                                            />
                                        </Link>
                                    </div>

                                    <div className="cart-product-information">
                                        <Link
                                            to={`/product/${item.product}`}
                                            className="cart-product-name"
                                        >
                                            {item.name}
                                        </Link>

                                        <p className="cart-product-price">
                                            {formatPrice(item.price)}
                                        </p>

                                        <p className="cart-product-stock">
                                            {item.stock > 0
                                                ? `${item.stock} available`
                                                : 'Out of stock'}
                                        </p>

                                        <div className="cart-quantity-controls">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    decreaseQty(
                                                        item.product,
                                                        Number(item.quantity)
                                                    )
                                                }
                                                disabled={Number(item.quantity) <= 1}
                                            >
                                                −
                                            </button>

                                            <span>{item.quantity}</span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    increaseQty(
                                                        item.product,
                                                        Number(item.quantity),
                                                        Number(item.stock)
                                                    )
                                                }
                                                disabled={
                                                    Number(item.quantity) >= Number(item.stock)
                                                }
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className="cart-item-total">
                                        <strong>
                                            {formatPrice(
                                                Number(item.price) *
                                                Number(item.quantity)
                                            )}
                                        </strong>

                                        <button
                                            type="button"
                                            className="cart-remove-btn"
                                            onClick={() =>
                                                removeCartItemHandler(item.product)
                                            }
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <Link to="/products" className="cart-back-link">
                                ← Continue Shopping
                            </Link>
                        </div>

                        <div className="col-12 col-lg-4">
                            <div className="spooky-cart-summary">
                                <h3>Order Summary</h3>

                                <div className="cart-summary-line">
                                    <span>Selected Products</span>
                                    <strong>{selectedItems.length}</strong>
                                </div>

                                <div className="cart-summary-line">
                                    <span>Selected Units</span>
                                    <strong>{selectedQuantity}</strong>
                                </div>

                                <div className="cart-summary-line">
                                    <span>Cart Products</span>
                                    <strong>{cartItems.length}</strong>
                                </div>

                                <hr />

                                <div className="cart-summary-total">
                                    <span>Selected Subtotal</span>
                                    <strong>{formatPrice(selectedSubtotal)}</strong>
                                </div>

                                <p className="cart-summary-note">
                                    Only checked products will be included in checkout.
                                    Unchecked products will remain in your cart.
                                </p>

                                <button
                                    type="button"
                                    className="cart-checkout-btn"
                                    onClick={checkoutHandler}
                                    disabled={selectedItems.length === 0}
                                >
                                    Checkout Selected ({selectedItems.length})
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Cart;
