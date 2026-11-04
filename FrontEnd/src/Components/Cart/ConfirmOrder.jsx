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
        selectedItems = JSON.parse(sessionStorage.getItem('checkoutItems') || '[]');
    } catch {
        selectedItems = [];
    }

    useEffect(() => {
        if (selectedItems.length === 0) navigate('/cart', { replace: true });
    }, [navigate, selectedItems.length]);

    const formatPrice = price =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(price) || 0);

    const itemsPrice = selectedItems.reduce(
        (total, item) => total + Number(item.sellPrice ?? item.price) * Number(item.quantity), 0
    );
    const shippingPrice = Number((itemsPrice * 0.05).toFixed(2));
    const taxPrice = 0;
    const totalPrice = Number((itemsPrice + shippingPrice).toFixed(2));

    const processToPayment = () => {
        if (selectedItems.length === 0) {
            navigate('/cart');
            return;
        }
        sessionStorage.setItem('orderInfo', JSON.stringify({
            itemsPrice: Number(itemsPrice.toFixed(2)), shippingPrice, taxPrice, totalPrice
        }));
        navigate('/payment');
    };

    if (selectedItems.length === 0) return null;

    return (
        <>
            <MetaData title="Confirm Order - SpookyMart" />
            <CheckoutSteps shipping confirmOrder />
            <main className="confirm-order-page">
                <div className="confirm-order-heading">
                    <h2>Review Your Order</h2>
                    <p>Check your delivery details and selected items before payment.</p>
                </div>

                <div className="confirm-order-layout">
                    <div className="confirm-order-main">
                        <section className="confirm-order-card">
                            <div className="confirm-card-heading">
                                <span className="confirm-card-icon"><i className="fa fa-map-marker" /></span>
                                <div><h4>Shipping Information</h4><p>Where should we deliver your order?</p></div>
                            </div>
                            <div className="confirm-shipping-grid">
                                {user && <div className="confirm-info-item"><small>Recipient</small><strong>{user.name}</strong></div>}
                                <div className="confirm-info-item"><small>Phone Number</small><strong>{shippingInfo.phoneNo}</strong></div>
                                <div className="confirm-info-item confirm-address"><small>Delivery Address</small><strong>{[shippingInfo.address, shippingInfo.city, shippingInfo.postalCode, shippingInfo.country].filter(Boolean).join(', ')}</strong></div>
                            </div>
                        </section>

                        <section className="confirm-order-card confirm-items-card">
                            <div className="confirm-card-heading">
                                <span className="confirm-card-icon"><i className="fa fa-shopping-bag" /></span>
                                <div><h4>Selected Items</h4><p>{selectedItems.length} product(s) in this order</p></div>
                            </div>
                            <div className="confirm-items-list">
                                {selectedItems.map(item => (
                                    <article className="confirm-item" key={item.product}>
                                        <img src={item.image} alt={item.name} />
                                        <div className="confirm-item-details">
                                            <Link to={`/product/${item.product}`}>{item.name}</Link>
                                            <small>Quantity: {item.quantity} × {formatPrice(item.sellPrice ?? item.price)}</small>
                                        </div>
                                        <strong className="confirm-item-total">
                                            {formatPrice(Number(item.quantity) * Number(item.sellPrice ?? item.price))}
                                        </strong>
                                    </article>
                                ))}
                            </div>
                        </section>
                    </div>

                    <aside className="confirm-order-sidebar">
                        <section className="confirm-order-summary">
                            <h4>Order Summary</h4>
                            <p><span>Subtotal</span><strong>{formatPrice(itemsPrice)}</strong></p>
                            <p><span>Shipping</span><strong>{formatPrice(shippingPrice)}</strong></p>
                            <div className="confirm-summary-total"><span>Total</span><strong>{formatPrice(totalPrice)}</strong></div>
                            <button id="checkout_btn" className="btn btn-primary btn-block" onClick={processToPayment}>
                                Proceed to Payment <i className="fa fa-arrow-right ml-2" />
                            </button>
                            <small className="confirm-summary-note">Please review your shipping information before continuing.</small>
                        </section>
                    </aside>
                </div>
            </main>
        </>
    );
};

export default ConfirmOrder;
