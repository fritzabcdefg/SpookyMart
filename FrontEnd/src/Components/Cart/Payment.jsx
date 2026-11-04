
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import MetaData from '../Layout/MetaData';
import CheckoutSteps from './CheckoutSteps';
import { useDispatch, useSelector } from 'react-redux';
import { createOrder, clearErrors } from '../../actions/orderActions';
import { getCheckoutShippingInfo, hasRequiredShippingInfo } from '../../utils/shippingInfo';

const Payment = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const API = import.meta.env.VITE_API;

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedCardId, setSelectedCardId] = useState('');
    const [loadingCards, setLoadingCards] = useState(true);
    const [cardError, setCardError] = useState('');

    const reduxShippingInfo = useSelector(state => state.cart.shippingInfo || {});
    const { user } = useSelector(state => state.auth);
    const shippingInfo = getCheckoutShippingInfo(reduxShippingInfo, user?._id);
    const { error, loading } = useSelector(state => state.newOrder);

    const [checkoutData] = useState(() => {
        try {
            return {
                selectedItems: JSON.parse(
                    sessionStorage.getItem('checkoutItems') || '[]'
                ),
                orderInfo: JSON.parse(
                    sessionStorage.getItem('orderInfo') || 'null'
                )
            };
        } catch (err) {
            console.error('Could not read checkout information:', err);
            return { selectedItems: [], orderInfo: null };
        }
    });

    const { selectedItems, orderInfo } = checkoutData;

    useEffect(() => {
        if (selectedItems.length === 0 || !orderInfo) {
            navigate('/cart', { replace: true });
        }
    }, [navigate, selectedItems.length, orderInfo]);

    useEffect(() => {
        let active = true;

        const loadSavedCards = async () => {
            try {
                const { data } = await axios.get(
                    `${API}/customer/me`,
                    { withCredentials: true }
                );

                if (!active) return;

                const cards = data.customer?.paymentMethods || [];

                setPaymentMethods(cards);

                if (cards.length > 0) {
                    const defaultCard =
                        cards.find(card => card.isDefault) || cards[0];

                    setSelectedCardId(defaultCard._id);
                }
            } catch (err) {
                if (active) {
                    setCardError(
                        err.response?.data?.message ||
                        'Unable to load saved cards.'
                    );
                }
            } finally {
                if (active) setLoadingCards(false);
            }
        };

        loadSavedCards();

        return () => {
            active = false;
        };
    }, []);

    const formatPrice = price =>
        new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(Number(price) || 0);

    const selectedCard = paymentMethods.find(
        card => card._id === selectedCardId
    );

    const submitHandler = async e => {
        e.preventDefault();

        if (selectedItems.length === 0 || !orderInfo) {
            navigate('/cart');
            return;
        }

        if (!hasRequiredShippingInfo(shippingInfo)) {
            navigate('/shipping');
            return;
        }

        if (paymentMethod === 'Card' && !selectedCard) {
            setCardError('Please select a saved card before continuing.');
            return;
        }

        const paymentInfo = {
            method: paymentMethod,
            status: paymentMethod === 'Card'
                ? 'succeeded'
                : 'pending'
        };

        if (paymentMethod === 'Card' && selectedCard) {
            paymentInfo.id = selectedCard._id;
            paymentInfo.brand = selectedCard.brand;
            paymentInfo.last4 = selectedCard.last4;
        }

        const order = {
            orderItems: selectedItems,
            shippingInfo,
            itemsPrice: orderInfo.itemsPrice,
            shippingPrice: orderInfo.shippingPrice,
            taxPrice: orderInfo.taxPrice,
            totalPrice: orderInfo.totalPrice,
            paymentInfo
        };

        try {
            dispatch(clearErrors());

            await dispatch(createOrder(order));

            navigate('/success');
        } catch (err) {
            console.error(
                'Order creation failed:',
                err.response?.data?.message || err.message
            );
        }
    };

    if (selectedItems.length === 0 || !orderInfo) {
        return null;
    }

    return (
        <>
            <MetaData title="Payment - SpookyMart" />

            <CheckoutSteps shipping confirmOrder payment />

            <div className="row wrapper checkout-form-wrapper payment-checkout">
                <div className="col-12 col-md-10 col-lg-7 col-xl-6 checkout-form-column">
                    <form
                        className="shadow-lg checkout-form payment-form"
                        onSubmit={submitHandler}
                    >
                        <h1 className="mb-4">Payment</h1>

                        <h5>
                            Selected Products: {selectedItems.length}
                        </h5>

                        <p>
                            Amount:{' '}
                            <strong>
                                {formatPrice(orderInfo.totalPrice)}
                            </strong>
                        </p>

                        <hr />

                        <h5 className="mb-3">
                            Select Payment Method
                        </h5>

                        <div className="form-group">
                            <div className="custom-control custom-radio mb-3">
                                <input
                                    type="radio"
                                    id="cod_payment"
                                    name="paymentMethod"
                                    className="custom-control-input"
                                    value="COD"
                                    checked={paymentMethod === 'COD'}
                                    onChange={() => {
                                        setPaymentMethod('COD');
                                        setCardError('');
                                    }}
                                />

                                <label
                                    className="custom-control-label"
                                    htmlFor="cod_payment"
                                >
                                    Cash on Delivery (COD)
                                </label>
                            </div>

                            <div className="custom-control custom-radio mb-3">
                                <input
                                    type="radio"
                                    id="card_payment"
                                    name="paymentMethod"
                                    className="custom-control-input"
                                    value="Card"
                                    checked={paymentMethod === 'Card'}
                                    onChange={() => {
                                        setPaymentMethod('Card');
                                        setCardError('');
                                    }}
                                />

                                <label
                                    className="custom-control-label"
                                    htmlFor="card_payment"
                                >
                                    Card Payment
                                </label>
                            </div>
                        </div>

                        {paymentMethod === 'COD' && (
                            <div className="alert alert-info">
                                Pay in cash when your order is delivered.
                            </div>
                        )}

                        {paymentMethod === 'Card' && (
                            <div className="mb-3">
                                <h5 className="mb-3">
                                    Choose a Saved Card
                                </h5>

                                {loadingCards ? (
                                    <p>Loading saved cards...</p>
                                ) : paymentMethods.length === 0 ? (
                                    <div className="alert alert-warning">
                                        <p>
                                            You have no saved cards yet.
                                        </p>

                                        <Link to="/me/payment-methods">
                                            Manage Payment Methods
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        <div className="form-group">
                                            <label htmlFor="savedCard">
                                                Saved Card
                                            </label>

                                            <select
                                                id="savedCard"
                                                className="form-control"
                                                value={selectedCardId}
                                                onChange={e =>
                                                    setSelectedCardId(e.target.value)
                                                }
                                                required
                                            >
                                                {paymentMethods.map(card => (
                                                    <option
                                                        key={card._id}
                                                        value={card._id}
                                                    >
                                                        {card.brand} ending in {card.last4}
                                                        {card.isDefault ? ' (Default)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {selectedCard && (
                                            <div className="card mb-3">
                                                <div className="card-body">
                                                    <h5>
                                                        {selectedCard.brand}
                                                    </h5>

                                                    <p className="mb-1">
                                                        Cardholder: {selectedCard.cardholderName}
                                                    </p>

                                                    <p className="mb-1">
                                                        Card ending in **** {selectedCard.last4}
                                                    </p>

                                                    <p className="mb-0">
                                                        Expires: {String(selectedCard.expiryMonth).padStart(2, '0')}/{selectedCard.expiryYear}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <Link to="/me/payment-methods">
                                            Manage Saved Cards
                                        </Link>
                                    </>
                                )}

                                <div className="alert alert-warning mt-3">
                                    <strong>Demo card payment</strong>
                                    <p className="mb-0">
                                        This is a simulated payment.
                                        No actual charge will be made.
                                        No full card number or CVV is collected.
                                    </p>
                                </div>
                            </div>
                        )}

                        {cardError && (
                            <div className="alert alert-danger">
                                {cardError}
                            </div>
                        )}

                        {error && (
                            <div className="alert alert-danger">
                                {error}
                            </div>
                        )}

                        <button
                            id="pay_btn"
                            type="submit"
                            className="btn btn-block py-3"
                            disabled={
                                loading ||
                                (paymentMethod === 'Card' &&
                                    (loadingCards || !selectedCard))
                            }
                        >
                            {loading
                                ? 'Processing Order...'
                                : paymentMethod === 'COD'
                                    ? 'Place Order'
                                    : `Simulate Card Payment - ${formatPrice(orderInfo.totalPrice)}`}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Payment;
