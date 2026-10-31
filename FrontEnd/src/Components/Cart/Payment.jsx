
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MetaData from '../Layout/MetaData';
import CheckoutSteps from './CheckoutSteps';
import { useDispatch, useSelector } from 'react-redux';
import { createOrder, clearErrors } from '../../actions/orderActions';

const Payment = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { shippingInfo } = useSelector(state => state.cart);
    const { error, loading } = useSelector(state => state.newOrder);

    let selectedItems = [];

    try {
        selectedItems = JSON.parse(
            sessionStorage.getItem('checkoutItems') || '[]'
        );
    } catch {
        selectedItems = [];
    }

    const orderInfo = JSON.parse(
        sessionStorage.getItem('orderInfo') || 'null'
    );

    useEffect(() => {
        if (error) {
            console.error(error);
            dispatch(clearErrors());
        }
    }, [dispatch, error]);

    useEffect(() => {
        if (selectedItems.length === 0 || !orderInfo) {
            navigate('/cart', { replace: true });
        }
    }, [navigate, selectedItems.length, orderInfo]);

    const formatPrice = price =>
        new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(Number(price) || 0);

    const submitHandler = async e => {
        e.preventDefault();

        if (selectedItems.length === 0 || !orderInfo) {
            navigate('/cart');
            return;
        }

        const order = {
            orderItems: selectedItems,
            shippingInfo,
            itemsPrice: orderInfo.itemsPrice,
            shippingPrice: orderInfo.shippingPrice,
            taxPrice: orderInfo.taxPrice,
            totalPrice: orderInfo.totalPrice,
            paymentInfo: {
                id: 'pi_1DpdYh2eZvKYlo2CYIynhU32',
                status: 'succeeded'
            }
        };

        try {
            await dispatch(createOrder(order));
            navigate('/success');
        } catch (err) {
            console.error('Order creation failed:', err);
        }
    };

    if (selectedItems.length === 0 || !orderInfo) return null;

    return (
        <>
            <MetaData title="Payment - SpookyMart" />
            <CheckoutSteps shipping confirmOrder payment />

            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form className="shadow-lg" onSubmit={submitHandler}>
                        <h1 className="mb-4">Payment</h1>

                        <h5>Selected Products: {selectedItems.length}</h5>

                        <p>
                            Amount to Pay:{' '}
                            <strong>
                                {formatPrice(orderInfo.totalPrice)}
                            </strong>
                        </p>

                        <hr />

                        <div className="form-group">
                            <label htmlFor="card_num_field">
                                Card Number
                            </label>
                            <input
                                type="text"
                                id="card_num_field"
                                className="form-control"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="card_exp_field">
                                Card Expiry
                            </label>
                            <input
                                type="text"
                                id="card_exp_field"
                                className="form-control"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="card_cvc_field">
                                Card CVC
                            </label>
                            <input
                                type="text"
                                id="card_cvc_field"
                                className="form-control"
                                required
                            />
                        </div>

                        <button
                            id="pay_btn"
                            type="submit"
                            className="btn btn-block py-3"
                            disabled={loading}
                        >
                            {loading
                                ? 'Processing...'
                                : `Pay ${formatPrice(orderInfo.totalPrice)}`}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Payment;
