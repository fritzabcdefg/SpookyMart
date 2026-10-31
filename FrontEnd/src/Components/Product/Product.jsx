
import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { addItemToCart } from '../../actions/cartActions';

const Product = ({ product }) => {
    const dispatch = useDispatch();

    const addToCartHandler = async () => {
        try {
            await dispatch(addItemToCart(product._id, 1));
            toast.success('Product added to cart!');
        } catch (error) {
            toast.error('Unable to add product to cart.');
            console.error('Add to cart error:', error);
        }
    };

    return (
        <div className="col-sm-12 col-md-6 col-lg-3 my-3">
            <div className="card product-card p-3 rounded">
                <img
                    className="card-img-top mx-auto product-card-image"
                    src={product.images?.[0]?.url || '/images/default_product.png'}
                    alt={product.name}
                />

                <div className="card-body d-flex flex-column">
                    <h5 className="card-title product-card-title">
                        <Link to={`/product/${product._id}`}>
                            {product.name}
                        </Link>
                    </h5>

                    <div className="ratings mt-auto">
                        <div className="rating-outer">
                            <div
                                className="rating-inner"
                                style={{
                                    width: `${(product.ratings / 5) * 100}%`
                                }}
                            />
                        </div>
                        <span id="no_of_reviews">
                            ({product.numOfReviews} reviews)
                        </span>
                    </div>

                    <p className="card-text product-card-price">
                        ₱{Number(product.price).toLocaleString('en-PH', {
                            minimumFractionDigits: 2
                        })}
                    </p>

                    <div className="product-card-buttons">
                        <button
                            type="button"
                            className="btn add-cart-btn"
                            onClick={addToCartHandler}
                            disabled={product.stock <= 0}
                        >
                            {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>

                        <Link
                            to={`/product/${product._id}`}
                            className="btn view-details-btn"
                        >
                            View Details
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Product;
