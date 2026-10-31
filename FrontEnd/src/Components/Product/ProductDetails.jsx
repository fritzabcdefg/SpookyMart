
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Carousel } from 'react-bootstrap';
import axios from 'axios';

import { useDispatch, useSelector } from 'react-redux';

import MetaData from '../Layout/MetaData';
import Loader from '../Layout/Loader';
import ListReviews from '../Review/ListReviews';

import { getUser, getToken } from '../Utils/helpers';
import { getProductDetails } from '../../actions/productActions';
import { addItemToCart } from '../../actions/cartActions';
import Product from './Product';

const ProductDetails = () => {
    const { id } = useParams();
    const dispatch = useDispatch();

    const {
        loading,
        error,
        product = {}
    } = useSelector(state => state.productDetails || {});

    const [quantity, setQuantity] = useState(1);
    const [user] = useState(getUser());

    const [activeImage, setActiveImage] = useState(0);

    // Review states
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [reviewError, setReviewError] = useState('');
    const [reviewSuccess, setReviewSuccess] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);

    // Review eligibility
    const [canReview, setCanReview] = useState(false);
    const [alreadyReviewed, setAlreadyReviewed] = useState(false);
    const [eligibilityLoading, setEligibilityLoading] = useState(false);

    const [relatedProducts, setRelatedProducts] = useState([]);

    const images = Array.isArray(product.images)
        ? product.images
        : [];

    // Load product details
    useEffect(() => {
        dispatch(getProductDetails(id));
        setQuantity(1);
        setActiveImage(0);
    }, [dispatch, id]);

    // Check whether the logged-in customer can review this product.
    useEffect(() => {
        let cancelled = false;

        const checkReviewEligibility = async () => {
            if (!user || !id || !getToken()) {
                setCanReview(false);
                setAlreadyReviewed(false);
                return;
            }

            try {
                setEligibilityLoading(true);

                const { data } = await axios.get(
                    `${import.meta.env.VITE_API}/review/my/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${getToken()}`
                        }
                    }
                );

                if (!cancelled) {
                    setCanReview(data.eligible);
                    setAlreadyReviewed(Boolean(data.review));

                    if (data.review) {
                        setRating(data.review.rating);
                        setComment(data.review.comment);
                    }
                }
            } catch (error) {
                if (!cancelled) {
                    setCanReview(false);
                    setAlreadyReviewed(false);
                }
            } finally {
                if (!cancelled) {
                    setEligibilityLoading(false);
                }
            }
        };

        checkReviewEligibility();

        return () => {
            cancelled = true;
        };
    }, [user, id]);

    useEffect(() => {
    if (!product?._id || !product?.category) return;

    let isMounted = true;

    const fetchRelatedProducts = async () => {
        try {
            const { data } = await axios.get(
                `${import.meta.env.VITE_API}/products?category=${encodeURIComponent(product.category)}`
            );

            if (isMounted) {
                const related = (data.products || [])
                    .filter(item => item._id !== product._id)
                    .slice(0, 4);

                setRelatedProducts(related);
            }
        } catch (error) {
            console.error('Failed to load related products:', error);
        }
    };

    fetchRelatedProducts();

        return () => {
            isMounted = false;
        };
    }, [product?._id, product?.category]);
    // Quantity controls
    const increaseQty = () => {
        if (quantity < Number(product.stock || 0)) {
            setQuantity(previous => previous + 1);
        }
    };

    const decreaseQty = () => {
        if (quantity > 1) {
            setQuantity(previous => previous - 1);
        }
    };

    // Add product to cart
    const addToCart = async () => {
        if (!product.stock || product.stock <= 0) {
            return;
        }

        await dispatch(addItemToCart(id, quantity));
    };

    // Submit customer review
    const reviewHandler = async (e) => {
        e.preventDefault();

        setReviewError('');
        setReviewSuccess('');

        if (rating < 1 || rating > 5) {
            setReviewError('Please select a rating.');
            return;
        }

        if (!comment.trim()) {
            setReviewError('Please enter your review.');
            return;
        }

        try {
            setReviewLoading(true);

            const { data } = await axios.put(
                `${import.meta.env.VITE_API}/review`,
                {
                    rating,
                    comment: comment.trim(),
                    productId: id
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${getToken()}`
                    }
                }
            );

            setReviewSuccess(data.message || 'Review submitted successfully!');
            setComment('');
            setRating(0);
            setCanReview(false);
            setAlreadyReviewed(true);

            // Refresh product information and reviews.
            dispatch(getProductDetails(id));

        } catch (error) {
            setReviewError(
                error.response?.data?.message ||
                'Unable to submit your review. Please try again.'
            );
        } finally {
            setReviewLoading(false);
        }
    };

    if (loading) {
        return (
            <>
                <MetaData title="Loading Product..." />
                <Loader />
            </>
        );
    }

    if (error || !product._id) {
        return (
            <>
                <MetaData title="Product Not Found" />

                <div className="container products-message mt-5">
                    <h4>Product Not Found</h4>
                    <p>
                        {error || 'This product may no longer be available.'}
                    </p>
                </div>
            </>
        );
    }

    return (
        <>
            <MetaData title={`${product.name} - SpookyMart`} />

            <div className="container product-details-page">

                <div className="row product-details-layout">

                    {/* Product Images */}
                    <div className="col-12 col-lg-6">
                        <div className="product-gallery">

                            {images.length > 0 ? (
                                <>
                                    <Carousel
                                        activeIndex={activeImage}
                                        onSelect={setActiveImage}
                                        pause="hover"
                                        indicators={images.length > 1}
                                        controls={images.length > 1}
                                    >
                                        {images.map((image, index) => (
                                            <Carousel.Item key={image.public_id || index}>
                                                <img
                                                    className="product-main-image"
                                                    src={image.url}
                                                    alt={`${product.name} ${index + 1}`}
                                                />
                                            </Carousel.Item>
                                        ))}
                                    </Carousel>

                                    {images.length > 1 && (
                                        <div className="product-image-thumbnails">
                                            {images.map((image, index) => (
                                                <button
                                                    type="button"
                                                    key={image.public_id || index}
                                                    className={`product-thumbnail ${
                                                        activeImage === index
                                                            ? 'active'
                                                            : ''
                                                    }`}
                                                    onClick={() => setActiveImage(index)}
                                                >
                                                    <img
                                                        src={image.url}
                                                        alt={`Thumbnail ${index + 1}`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="product-no-image">
                                    No product image available
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Product Information */}
                    <div className="col-12 col-lg-6">
                        <div className="product-information">

                            <span className="product-category">
                                {product.category}
                            </span>

                            <h1 className="product-details-title">
                                {product.name}
                            </h1>

                            {/* Ratings */}
                            <div className="product-rating-section">
                                <div className="rating-outer">
                                    <div
                                        className="rating-inner"
                                        style={{
                                            width: `${
                                                (Number(product.ratings || 0) / 5) * 100
                                            }%`
                                        }}
                                    />
                                </div>

                                <span id="no_of_reviews">
                                    ({product.reviews?.length || 0} actual reviews)
                                </span>
                            </div>

                            <hr />

                            {/* Price */}
                            <p id="product_price">
                                ₱{Number(product.price || 0).toLocaleString(
                                    'en-PH',
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }
                                )}
                            </p>

                            {/* Stock */}
                            <p className="product-stock-text">
                                Availability:

                                <span
                                    className={
                                        product.stock > 0
                                            ? 'greenColor'
                                            : 'redColor'
                                    }
                                >
                                    {product.stock > 0
                                        ? ` In Stock (${product.stock} available)`
                                        : ' Out of Stock'}
                                </span>
                            </p>

                            {/* Quantity */}
                            <div className="product-quantity-section">
                                <span>Quantity:</span>

                                <div className="stockCounter">
                                    <button
                                        type="button"
                                        className="btn minus"
                                        onClick={decreaseQty}
                                        disabled={quantity <= 1}
                                    >
                                        -
                                    </button>

                                    <input
                                        type="number"
                                        className="form-control count"
                                        value={quantity}
                                        readOnly
                                    />

                                    <button
                                        type="button"
                                        className="btn plus"
                                        onClick={increaseQty}
                                        disabled={
                                            quantity >= Number(product.stock || 0)
                                        }
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Add to Cart */}
                            <button
                                type="button"
                                id="cart_btn"
                                className="btn mt-3"
                                disabled={!product.stock || product.stock <= 0}
                                onClick={addToCart}
                            >
                                <i className="fa fa-shopping-cart mr-2" />
                                Add to Cart
                            </button>

                            <hr />

                            {/* Description */}
                            <h4 className="product-section-title">
                                Description
                            </h4>

                            <p className="product-description">
                                {product.description}
                            </p>

                            <hr />

                            {/* Seller */}
                            <p className="product-seller">
                                Sold by: <strong>{product.seller || 'SpookyMart'}</strong>
                            </p>

                        </div>
                    </div>
                </div>

                {/* Customer Reviews */}
                <div className="product-reviews-section">

                    <h2 className="product-section-title">
                        Customer Reviews
                    </h2>

                    <div className="product-review-summary">
                        <span className="product-average-rating">
                            {Number(product.ratings || 0).toFixed(1)}
                        </span>

                        <div>
                            <div className="rating-outer">
                                <div
                                    className="rating-inner"
                                    style={{
                                        width: `${
                                            (Number(product.ratings || 0) / 5) * 100
                                        }%`
                                    }}
                                />
                            </div>

                            <p>
                                Based on {product.reviews?.length || 0} actual
                                customer reviews
                            </p>
                        </div>
                    </div>

                    {product.reviews?.length > 0 ? (
                        <ListReviews reviews={product.reviews} />
                    ) : (
                        <div className="products-message">
                            <h4>No Reviews Yet</h4>
                            <p>Be the first eligible customer to review this product.</p>
                        </div>
                    )}

                    {/* Review Form */}
                    <div className="product-review-form">

                        {!user ? (
                            <p>Please log in to check your review eligibility.</p>
                        ) : eligibilityLoading ? (
                            <p>Checking review eligibility...</p>
                        ) : alreadyReviewed ? (
                            <p>You have already reviewed this product. You can update your review from your Orders page.</p>
                        ) : canReview ? (
                            <form onSubmit={reviewHandler}>

                                <h4>Write Your Review</h4>

                                <p>Select your rating:</p>

                                <div className="review-star-selector">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            type="button"
                                            key={star}
                                            className={
                                                star <= rating
                                                    ? 'review-star selected'
                                                    : 'review-star'
                                            }
                                            onClick={() => setRating(star)}
                                            aria-label={`Rate ${star} out of 5`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    className="form-control"
                                    rows="4"
                                    placeholder="Share your experience with this product..."
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    required
                                />

                                {reviewError && (
                                    <p className="review-error">
                                        {reviewError}
                                    </p>
                                )}

                                {reviewSuccess && (
                                    <p className="review-success">
                                        {reviewSuccess}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    className="btn review-submit-btn mt-3"
                                    disabled={reviewLoading}
                                >
                                    {reviewLoading
                                        ? 'Submitting...'
                                        : 'Submit Review'}
                                </button>

                            </form>
                        ) : (
                            <p>
                                Reviews are available to customers who have
                                confirmed receipt of this product.
                            </p>
                        )}

                        {reviewError && !canReview && (
                            <p className="review-error">{reviewError}</p>
                        )}

                    </div>
                    {relatedProducts.length > 0 && (
                        <section className="related-products-section">
                            <h2>You May Also Like</h2>
                            <p>Discover more products from the same category.</p>

                            <div className="row">
                                {relatedProducts.map(item => (
                                    <Product
                                        key={item._id}
                                        product={item}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </>
    );
};

export default ProductDetails;
