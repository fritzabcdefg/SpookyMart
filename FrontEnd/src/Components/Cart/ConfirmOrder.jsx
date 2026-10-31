
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MetaData from '../Layout/MetaData';
import CheckoutSteps from './CheckoutSteps';
import { useSelector } from 'react-redux';

const ConfirmOrder = () => {
    const navigate = useNavigate();

    const { shippingInfo } = useSelector(state => state.cart);
    const { user } = useSelector(state => state.auth);

    let selectedItems = [];

    try {
        selectedItems = JSON.parse(
            sessionStorage.getItem('checkoutItems') || '[]'
        );
    } catch {
        selectedItems = [];
    }

    useEffect(() => {
        if (selectedItems.length === 0) {
            navigate('/cart', { replace: true });
        }
    }, [navigate, selectedItems.length]);

    const formatPrice = price =>
        new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(Number(price) || 0);

    const itemsPrice = selectedItems.reduce(
        (total, item) =>
            total + Number(item.price) * Number(item.quantity),
        0
    );

    const shippingPrice = itemsPrice > 200 ? 0 : 25;
    const taxPrice = Number((0.05 * itemsPrice).toFixed(2));
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    const processToPayment = () => {
        if (selectedItems.length === 0) {
            navigate('/cart');
            return;
        }

        const data = {
            itemsPrice: itemsPrice.toFixed(2),
            shippingPrice,
            taxPrice,
            totalPrice: totalPrice.toFixed(2)
        };

        sessionStorage.setItem('orderInfo', JSON.stringify(data));
        navigate('/payment');
    };

    if (selectedItems.length === 0) return null;

    return (
        <>
            <MetaData title="Confirm Order - SpookyMart" />
            <CheckoutSteps shipping confirmOrder />

            <div className="row d-flex justify-content-between">
                <div className="col-12 col-lg-8 mt-5 order-confirm">
                    <h4 className="mb-3">Shipping Info</h4>

                    {user && (
                        <p><b>Name:</b> {user.name}</p>
                    )}

                    <p><b>Phone:</b> {shippingInfo.phoneNo}</p>

                    <p className="mb-4">
                        <b>Address:</b>{' '}
                        {`${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.postalCode}, ${shippingInfo.country}`}
                    </p>

                    <hr />

                    <h4 className="mt-4">Selected Items:</h4>

                    {selectedItems.map(item => (
                        <div className="cart-item my-1" key={item.product}>
                            <hr />

                            <div className="row align-items-center">
                                <div className="col-4 col-lg-2">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        height="55"
                                        width="70"
                                    />
                                </div>

                                <div className="col-5 col-lg-6">
                                    <Link to={`/product/${item.product}`}>
                                        {item.name}
                                    </Link>
                                </div>

                                <div className="col-12 col-lg-4">
                                    <p>
                                        {item.quantity} × {formatPrice(item.price)}
                                        {' = '}
                                        <b>
                                            {formatPrice(
                                                item.quantity * item.price
                                            )}
                                        </b>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}

                    <hr />
                    <p>
                        <b>{selectedItems.length}</b> selected product(s) will be
                        included in this order.
                    </p>
                </div>

                <div className="col-12 col-lg-3 my-4">
                    <div id="order_summary">
                        <h4>Order Summary</h4>
                        <hr />

                        <p>
                            Subtotal:
                            <span className="order-summary-values">
                                {formatPrice(itemsPrice)}
                            </span>
                        </p>

                        <p>
                            Shipping:
                            <span className="order-summary-values">
                                {formatPrice(shippingPrice)}
                            </span>
                        </p>

                        <p>
                            Tax:
                            <span className="order-summary-values">
                                {formatPrice(taxPrice)}
                            </span>
                        </p>

                        <hr />

                        <p>
                            Total:
                            <span className="order-summary-values">
                                {formatPrice(totalPrice)}
                            </span>
                        </p>

                        <hr />

                        <button
                            id="checkout_btn"
                            className="btn btn-primary btn-block"
                            onClick={processToPayment}
                        >
                            Proceed to Payment
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ConfirmOrder;
