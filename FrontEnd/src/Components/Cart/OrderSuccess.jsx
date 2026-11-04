import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import MetaData from '../Layout/MetaData';
import { removePurchasedItemsFromCart } from '../../actions/cartActions';

const OrderSuccess = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const cleanPurchasedItems = async () => {
            let purchasedItems = [];

            try {
                purchasedItems = JSON.parse(
                    sessionStorage.getItem('checkoutItems') || '[]'
                );
            } catch (error) {
                console.error('Could not read checkout items:', error);
            }

            const productIds = purchasedItems
                .map(item => item.product)
                .filter(Boolean);

            try {
                if (productIds.length > 0) {
                    await dispatch(
                        removePurchasedItemsFromCart(productIds)
                    );
                }

                sessionStorage.removeItem('checkoutItems');
                sessionStorage.removeItem('orderInfo');
            } catch (error) {
                console.error(
                    'Could not remove purchased products from cart:',
                    error
                );
                // Keep checkoutItems so cleanup can be retried if this page reloads.
            }
        };

        cleanPurchasedItems();
    }, [dispatch]);

    return (
        <>
            <MetaData title="Order Success - SpookyMart" />

            <main className="order-success-page">
                <section className="order-success-card" aria-labelledby="order-success-title">
                    <div className="order-success-icon" aria-hidden="true">
                        <span>✓</span>
                    </div>

                    <p className="order-success-eyebrow">SPOOKYMART CHECKOUT</p>
                    <h1 id="order-success-title">Your Order has been placed successfully.</h1>
                    <p className="order-success-message">
                        Your purchased products have been removed from your cart.
                    </p>

                    <div className="order-success-actions">
                        <Link to="/orders/me" className="order-success-primary">
                            Go to Orders
                        </Link>
                        <Link to="/cart" className="order-success-secondary">
                            Return to Shopping Cart
                        </Link>
                    </div>
                </section>
            </main>
        </>
    );
};

export default OrderSuccess;