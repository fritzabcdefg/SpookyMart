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

            <div className="row justify-content-center">
                <div className="col-10 col-md-6 mt-5 text-center">
                    <img
                        className="my-5 img-fluid d-block mx-auto"
                        src="/images/order_success.png"
                        alt="Order Success"
                        width="200"
                        height="200"
                    />

                    <h2>Your Order has been placed successfully.</h2>

                    <p>Your purchased products have been removed from your cart.</p>

                    <Link to="/orders/me">
                        Go to Orders
                    </Link>

                    <br />

                    <Link to="/cart">
                        Return to Shopping Cart
                    </Link>
                </div>
            </div>
        </>
    );
};

export default OrderSuccess;