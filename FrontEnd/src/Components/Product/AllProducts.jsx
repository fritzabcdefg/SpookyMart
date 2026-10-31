import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Pagination from '@mui/material/Pagination';

import { getProducts } from '../../actions/productActions';
import Product from './Product';
import MetaData from '../Layout/MetaData';
import Loader from '../Layout/Loader';

const AllProducts = () => {
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();

    const keyword = searchParams.get('keyword') || '';

    const [searchInput, setSearchInput] = useState(keyword);

    const [price, setPrice] = useState([1, 10000]);
    const [draftPrice, setDraftPrice] = useState([1, 10000]);

    const [category, setCategory] = useState('');
    const [ratings, setRatings] = useState(0);
    const [reviews, setReviews] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    const {
        loading,
        error,
        products = [],
        resPerPage = 4,
        filteredProductsCount = 0
    } = useSelector(state => state.products || {});

    // Synchronize search input with URL.
    useEffect(() => {
        setSearchInput(keyword);
        setCurrentPage(1);
    }, [keyword]);

    // Fetch products whenever search, filters, or page changes.
    useEffect(() => {
        dispatch(
            getProducts(
                currentPage,
                keyword,
                price,
                category,
                ratings,
                reviews
            )
        );
    }, [
        dispatch,
        currentPage,
        keyword,
        price,
        category,
        ratings,
        reviews
    ]);

    const searchHandler = (e) => {
        e.preventDefault();

        const searchTerm = searchInput.trim();

        setCurrentPage(1);

        if (searchTerm) {
            setSearchParams({ keyword: searchTerm });
        } else {
            setSearchParams({});
        }
    };

    const clearSearch = () => {
        setSearchInput('');
        setCurrentPage(1);
        setSearchParams({});
    };

    const clearFilters = () => {
        setPrice([1, 10000]);
        setDraftPrice([1, 10000]);
        setCategory('');
        setRatings(0);
        setReviews(0);
        setCurrentPage(1);
    };

    const priceChangeHandler = (event, newValue) => {
        setDraftPrice(newValue);
    };

    const priceChangeCommittedHandler = (event, newValue) => {
        setPrice(newValue);
        setCurrentPage(1);
    };

    const categoryChangeHandler = (e) => {
        setCategory(e.target.value);
        setCurrentPage(1);
    };

    const ratingsChangeHandler = (e) => {
        setRatings(Number(e.target.value));
        setCurrentPage(1);
    };

    const reviewsChangeHandler = (e) => {
        setReviews(Number(e.target.value));
        setCurrentPage(1);
    };

    const pageChangeHandler = (event, value) => {
        setCurrentPage(value);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            <MetaData title="All Products - SpookyMart" />

            <div className="container products-page">

                <div className="products-page-heading">
                    <h1 id="products_heading">All Products</h1>
                    <p>Find something spooky for every occasion.</p>
                </div>

                {/* Search */}
                <form
                    className="products-search-form"
                    onSubmit={searchHandler}
                >
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search products..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />

                    <button type="submit" className="btn">
                        Search
                    </button>

                    {keyword && (
                        <button
                            type="button"
                            className="btn clear-search-btn"
                            onClick={clearSearch}
                        >
                            Clear Search
                        </button>
                    )}
                </form>

                <div className="row products-catalog-layout">

                    {/* Filters */}
                    <aside className="col-12 col-md-3">
                        <div className="products-filter-panel">

                            <div className="filter-panel-heading">
                                <h3>Filters</h3>

                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="clear-filters-btn"
                                >
                                    Clear Filters
                                </button>
                            </div>

                            {/* Price */}
                            <div className="product-filter">
                                <h4>Price Range</h4>

                                <Box sx={{ width: '100%', px: 1 }}>
                                    <Slider
                                        value={draftPrice}
                                        onChange={priceChangeHandler}
                                        onChangeCommitted={priceChangeCommittedHandler}
                                        valueLabelDisplay="auto"
                                        min={1}
                                        max={10000}
                                        step={100}
                                        sx={{
                                            color: '#ff6600'
                                        }}
                                    />
                                </Box>

                                <div className="price-range-labels">
                                    <span>
                                        ₱{draftPrice[0].toLocaleString()}
                                    </span>
                                    <span>
                                        ₱{draftPrice[1].toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Category */}
                            <div className="product-filter">
                                <h4>Category</h4>

                                <select
                                    className="form-control"
                                    value={category}
                                    onChange={categoryChangeHandler}
                                >
                                    <option value="">All Categories</option>
                                    <option value="Decorations">
                                        Decorations
                                    </option>
                                    <option value="Costumes">
                                        Costumes
                                    </option>
                                </select>
                            </div>

                            {/* Ratings */}
                            <div className="product-filter">
                                <h4>Minimum Rating</h4>

                                <select
                                    className="form-control"
                                    value={ratings}
                                    onChange={ratingsChangeHandler}
                                >
                                    <option value="0">All Ratings</option>
                                    <option value="1">1 Star & Up</option>
                                    <option value="2">2 Stars & Up</option>
                                    <option value="3">3 Stars & Up</option>
                                    <option value="4">4 Stars & Up</option>
                                    <option value="5">5 Stars Only</option>
                                </select>
                            </div>

                            {/* Reviews */}
                            <div className="product-filter">
                                <h4>Minimum Reviews</h4>

                                <select
                                    className="form-control"
                                    value={reviews}
                                    onChange={reviewsChangeHandler}
                                >
                                    <option value="0">All Reviews</option>
                                    <option value="1">1+ Reviews</option>
                                    <option value="5">5+ Reviews</option>
                                    <option value="10">10+ Reviews</option>
                                    <option value="20">20+ Reviews</option>
                                </select>
                            </div>

                        </div>
                    </aside>

                    {/* Product Results */}
                    <main className="col-12 col-md-9">

                        <div className="products-results-heading">
                            <h3>Products</h3>
                            <span>
                                {filteredProductsCount} product(s) found
                            </span>
                        </div>

                        {loading ? (
                            <Loader />
                        ) : error ? (
                            <div className="products-message">
                                <h4>Unable to load products</h4>
                                <p>{String(error)}</p>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="products-message">
                                <h4>No products found</h4>
                                <p>
                                    Try changing your search or filters.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="row">
                                    {products.map(product => (
                                        <Product
                                            key={product._id}
                                            product={product}
                                        />
                                    ))}
                                </div>

                                {resPerPage > 0 &&
                                    filteredProductsCount > resPerPage && (
                                        <div className="d-flex justify-content-center mt-5">
                                            <Stack spacing={2}>
                                                <Pagination
                                                    count={Math.ceil(
                                                        filteredProductsCount /
                                                        resPerPage
                                                    )}
                                                    page={currentPage}
                                                    onChange={pageChangeHandler}
                                                    color="primary"
                                                    variant="outlined"
                                                    shape="rounded"
                                                    showFirstButton
                                                    showLastButton
                                                    size="large"
                                                />
                                            </Stack>
                                        </div>
                                    )}
                            </>
                        )}

                    </main>
                </div>
            </div>
        </>
    );
};

export default AllProducts
