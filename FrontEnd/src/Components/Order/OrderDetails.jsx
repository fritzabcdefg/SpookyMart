
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import MetaData from '../Layout/MetaData';
import Loader from '../Layout/Loader';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderDetails } from '../../actions/orderActions';

const OrderDetails = () => {
    const dispatch = useDispatch();
    const { id } = useParams();

    const {
        loading,
        error,
        order = {}
    } = useSelector(state => state.orderDetails);

    const {
        shippingInfo,
        orderItems = [],
        paymentInfo,
        user,
        totalPrice,
        orderStatus,
        isReceived
    } = order;

    const [myReviews, setMyReviews] = useState({});
    const [forms, setForms] = useState({});
    const [openProductId, setOpenProductId] = useState(null);
    const [savingProductId, setSavingProductId] = useState(null);

    useEffect(() => {
        dispatch(getOrderDetails(id));
    }, [dispatch, id]);

    useEffect(() => {
        if (error) {
            toast.error(
                typeof error === 'string'
                    ? error
                    : 'Unable to load order details'
            );
        }
    }, [error]);

    useEffect(() => {
        let cancelled = false;

        const loadMyReviews = async () => {
            if (
                order.orderStatus !== 'Delivered' ||
                order.isReceived !== true ||
                !order.orderItems?.length
            ) {
                setMyReviews({});
                return;
            }

            const uniqueProductIds = [
                ...new Set(
                    order.orderItems
                        .map(item => item.product)
                        .filter(Boolean)
                )
            ];

            const results = await Promise.all(
                uniqueProductIds.map(async productId => {
                    try {
                        const { data } = await axios.get(
                            `${import.meta.env.VITE_API}/review/my/${productId}`,
                            { withCredentials: true }
                        );

                        return [productId, data];
                    } catch {
                        return [productId, null];
                    }
                })
            );

            if (cancelled) return;

            const reviewMap = {};
            const formMap = {};

            results.forEach(([productId, data]) => {
                reviewMap[productId] = data?.review || null;
                formMap[productId] = {
                    rating: data?.review?.rating || 5,
                    comment: data?.review?.comment || ''
                };
            });

            setMyReviews(reviewMap);
            setForms(formMap);
        };

        loadMyReviews();

        return () => {
            cancelled = true;
        };
    }, [order._id, order.orderStatus, order.isReceived, order.orderItems]);

    const isCompleted =
        orderStatus === 'Delivered' && isReceived === true;

    const shippingDetails = shippingInfo
        ? `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.postalCode}, ${shippingInfo.country}`
        : '';

    const isPaid = paymentInfo?.status === 'succeeded';

    const updateForm = (productId, field, value) => {
        setForms(previous => ({
            ...previous,
            [productId]: {
                ...(previous[productId] || { rating: 5, comment: '' }),
                [field]: value
            }
        }));
    };

    const saveReview = async (productId) => {
        const form = forms[productId] || {};
        const rating = Number(form.rating);
        const comment = form.comment?.trim();

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            toast.error('Please select a rating from 1 to 5.');
            return;
        }

        if (!comment) {
            toast.error('Please enter a review comment.');
            return;
        }

        const isEditing = Boolean(myReviews[productId]);

        try {
            setSavingProductId(productId);

            const endpoint = isEditing
                ? '/review/update'
                : '/review';

            const { data } = await axios.put(
                `${import.meta.env.VITE_API}${endpoint}`,
                {
                    productId,
                    rating,
                    comment
                },
                { withCredentials: true }
            );

            // Refresh the customer's own review for this product.
            const reviewResponse = await axios.get(
                `${import.meta.env.VITE_API}/review/my/${productId}`,
                { withCredentials: true }
            );

            setMyReviews(previous => ({
                ...previous,
                [productId]: reviewResponse.data.review
            }));

            setForms(previous => ({
                ...previous,
                [productId]: {
                    rating: reviewResponse.data.review?.rating || rating,
                    comment: reviewResponse.data.review?.comment || comment
                }
            }));

            setOpenProductId(null);
            toast.success(data.message || 'Review saved successfully.');

            // Reload the order details in case related data changed.
            dispatch(getOrderDetails(id));
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                'Unable to save your review.'
            );
        } finally {
            setSavingProductId(null);
        }
    };

    return (
        <>
            <MetaData title="Order Details" />

            {loading ? (
                <Loader />
            ) : (
                <div className="row d-flex justify-content-between">
                    <div className="col-12 col-lg-8 mt-5 order-details">
                        <h1 className="my-5">
                            Order # {order._id}
                        </h1>

                        <h4 className="mb-4">Shipping Info</h4>
                        <p><b>Name:</b> {user?.name}</p>
                        <p><b>Phone:</b> {shippingInfo?.phoneNo}</p>
                        <p><b>Address:</b> {shippingDetails}</p>
                        <p><b>Amount:</b> ₱{totalPrice}</p>

                        <hr />

                        <h4 className="my-4">Payment</h4>
                        <p className={isPaid ? 'greenColor' : 'redColor'}>
                            <b>{isPaid ? 'PAID' : 'NOT PAID'}</b>
                        </p>

                        <h4 className="my-4">Order Status</h4>
                        <p className={
                            isCompleted || orderStatus === 'Delivered'
                                ? 'greenColor'
                                : 'redColor'
                        }>
                            <b>{isCompleted ? 'Completed' : orderStatus}</b>
                        </p>

                        {orderStatus === 'Delivered' && !isReceived && (
                            <p>
                                Return to <Link to="/orders/me">My Orders</Link>
                                {' '}to confirm that you received this order.
                            </p>
                        )}

                        <hr />

                        <h4 className="my-4">Order Items</h4>

                        {orderItems.map(item => {
                            const productId =
                                typeof item.product === 'object'
                                    ? item.product._id
                                    : item.product;

                            const review = myReviews[productId];
                            const form = forms[productId] || {
                                rating: 5,
                                comment: ''
                            };

                            const formIsOpen =
                                openProductId === productId;

                            return (
                                <div
                                    key={productId}
                                    className="my-4 p-3"
                                    style={{
                                        border: '1px solid #ddd',
                                        borderRadius: '8px'
                                    }}
                                >
                                    <div className="row align-items-center">
                                        <div className="col-4 col-lg-2">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                height="55"
                                                width="70"
                                                style={{ objectFit: 'contain' }}
                                            />
                                        </div>

                                        <div className="col-8 col-lg-6">
                                            <Link to={`/products/${productId}`}>
                                                {item.name}
                                            </Link>
                                            <p className="mb-0">
                                                {item.quantity} piece(s)
                                            </p>
                                        </div>

                                        <div className="col-12 col-lg-4 mt-2">
                                            <b>₱{item.price}</b>
                                        </div>
                                    </div>

                                    {isCompleted && (
                                        <div className="mt-3">
                                            {review && (
                                                <p className="mb-2">
                                                    <b>Your rating:</b>{' '}
                                                    {review.rating}/5
                                                    <br />
                                                    <b>Your review:</b>{' '}
                                                    {review.comment}
                                                </p>
                                            )}

                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={() => {
                                                    setForms(previous => ({
                                                        ...previous,
                                                        [productId]: {
                                                            rating:
                                                                myReviews[productId]?.rating || 5,
                                                            comment:
                                                                myReviews[productId]?.comment || ''
                                                        }
                                                    }));

                                                    setOpenProductId(
                                                        formIsOpen ? null : productId
                                                    );
                                                }}
                                            >
                                                {formIsOpen
                                                    ? 'Cancel'
                                                    : review
                                                        ? 'Edit Review'
                                                        : 'Submit Review'}
                                            </button>

                                            {formIsOpen && (
                                                <div className="mt-3">
                                                    <label
                                                        htmlFor={`rating-${productId}`}
                                                        className="form-label"
                                                    >
                                                        Rating
                                                    </label>

                                                    <select
                                                        id={`rating-${productId}`}
                                                        className="form-control mb-3"
                                                        value={form.rating}
                                                        onChange={event =>
                                                            updateForm(
                                                                productId,
                                                                'rating',
                                                                event.target.value
                                                            )
                                                        }
                                                    >
                                                        <option value={5}>5 - Excellent</option>
                                                        <option value={4}>4 - Very good</option>
                                                        <option value={3}>3 - Good</option>
                                                        <option value={2}>2 - Fair</option>
                                                        <option value={1}>1 - Poor</option>
                                                    </select>

                                                    <label
                                                        htmlFor={`comment-${productId}`}
                                                        className="form-label"
                                                    >
                                                        Your review
                                                    </label>

                                                    <textarea
                                                        id={`comment-${productId}`}
                                                        className="form-control mb-3"
                                                        rows="4"
                                                        maxLength={1000}
                                                        value={form.comment}
                                                        onChange={event =>
                                                            updateForm(
                                                                productId,
                                                                'comment',
                                                                event.target.value
                                                            )
                                                        }
                                                        placeholder="Share your experience with this product..."
                                                    />

                                                    <button
                                                        type="button"
                                                        className="btn btn-success"
                                                        disabled={
                                                            savingProductId === productId
                                                        }
                                                        onClick={() =>
                                                            saveReview(productId)
                                                        }
                                                    >
                                                        {savingProductId === productId
                                                            ? 'Saving...'
                                                            : review
                                                                ? 'Update Review'
                                                                : 'Submit Review'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
};

export default OrderDetails;
