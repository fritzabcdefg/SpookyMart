import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';

import { getProducts } from '../../actions/productActions';
import { getCategories } from '../../actions/categoryActions';
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

    const { categories = [] } = useSelector(state => state.categories || {});
    const {
        loading,
        error,
        products = [],
        filteredProductsCount = 0,
        resPerPage = 4
    } = useSelector(state => state.products || {});

    const totalPages = Math.ceil(filteredProductsCount / resPerPage);

    useEffect(() => { dispatch(getCategories()); }, [dispatch]);

    useEffect(() => {
        setSearchInput(keyword);
        setCurrentPage(1);
    }, [keyword]);

    useEffect(() => {
        dispatch(getProducts(
            currentPage,
            keyword,
            price,
            category,
            ratings,
            reviews
        ));
    }, [dispatch, currentPage, keyword, price, category, ratings, reviews]);

    const searchHandler = event => {
        event.preventDefault();
        const searchTerm = searchInput.trim();
        setCurrentPage(1);
        setSearchParams(searchTerm ? { keyword: searchTerm } : {});
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

    const priceChangeHandler = (event, newValue) => setDraftPrice(newValue);

    const priceChangeCommittedHandler = (event, newValue) => {
        setPrice(newValue);
        setCurrentPage(1);
    };

    const categoryChangeHandler = event => {
        setCategory(event.target.value);
        setCurrentPage(1);
    };

    const ratingsChangeHandler = event => {
        setRatings(Number(event.target.value));
        setCurrentPage(1);
    };

    const reviewsChangeHandler = event => {
        setReviews(Number(event.target.value));
        setCurrentPage(1);
    };

    return (
        <>
            <MetaData title="All Products - SpookyMart" />

            <div className="container products-page">
                <div className="products-page-heading">
                    <h1 id="products_heading">All Products</h1>
                    <p>Find something spooky for every occasion.</p>
                </div>

                <form className="products-search-form" onSubmit={searchHandler}>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search products..."
                        value={searchInput}
                        onChange={event => setSearchInput(event.target.value)}
                    />
                    <button type="submit" className="btn">Search</button>
                    {keyword && (
                        <button type="button" className="btn clear-search-btn" onClick={clearSearch}>
                            Clear Search
                        </button>
                    )}
                </form>

                <div className="row products-catalog-layout">
                    <aside className="col-12 col-md-3">
                        <div className="products-filter-panel">
                            <div className="filter-panel-heading">
                                <h3>Filters</h3>
                                <button type="button" onClick={clearFilters} className="clear-filters-btn">
                                    Clear Filters
                                </button>
                            </div>

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
                                        sx={{ color: '#ff852b' }}
                                    />
                                </Box>
                                <div className="price-range-labels">
                                    <span>₱{draftPrice[0].toLocaleString()}</span>
                                    <span>₱{draftPrice[1].toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="product-filter">
                                <h4>Category</h4>
                                <select className="form-control" value={category} onChange={categoryChangeHandler}>
                                    <option value="">All Categories</option>
                                    {categories
                                        .filter(item => !['costumes', 'decorations'].includes(item.name?.trim().toLowerCase()))
                                        .map(item => (
                                            <option key={item._id} value={item.name}>{item.name}</option>
                                        ))}
                                </select>
                            </div>

                            <div className="product-filter">
                                <h4>Minimum Rating</h4>
                                <select className="form-control" value={ratings} onChange={ratingsChangeHandler}>
                                    <option value="0">All Ratings</option>
                                    <option value="1">1 Star &amp; Up</option>
                                    <option value="2">2 Stars &amp; Up</option>
                                    <option value="3">3 Stars &amp; Up</option>
                                    <option value="4">4 Stars &amp; Up</option>
                                    <option value="5">5 Stars Only</option>
                                </select>
                            </div>

                            <div className="product-filter">
                                <h4>Minimum Reviews</h4>
                                <select className="form-control" value={reviews} onChange={reviewsChangeHandler}>
                                    <option value="0">All Reviews</option>
                                    <option value="1">1+ Reviews</option>
                                    <option value="5">5+ Reviews</option>
                                    <option value="10">10+ Reviews</option>
                                    <option value="20">20+ Reviews</option>
                                </select>
                            </div>
                        </div>
                    </aside>

                    <main className="col-12 col-md-9">
                        <div className="products-results-heading">
                            <h3>Products</h3>
                            <span>{filteredProductsCount} product(s) found</span>
                        </div>

                        {products.length === 0 && loading ? (
                            <Loader />
                        ) : error && products.length === 0 ? (
                            <div className="products-message">
                                <h4>Unable to load products</h4>
                                <p>{String(error)}</p>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="products-message">
                                <h4>No products found</h4>
                                <p>Try changing your search or filters.</p>
                            </div>
                        ) : (
                            <>
                                <div className="row">
                                    {products.map((product, index) => (
                                        <Product key={`${product._id}-${index}`} product={product} />
                                    ))}
                                </div>

                                {totalPages > 1 && (
                                    <nav className="mt-4" aria-label="Product pages">
                                        <ul className="pagination justify-content-center">
                                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                <button className="page-link" disabled={currentPage === 1 || loading} onClick={() => setCurrentPage(page => page - 1)}>Previous</button>
                                            </li>
                                            {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
                                                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                                    <button className="page-link" disabled={loading} onClick={() => setCurrentPage(page)} aria-current={currentPage === page ? 'page' : undefined}>{page}</button>
                                                </li>
                                            ))}
                                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                <button className="page-link" disabled={currentPage === totalPages || loading} onClick={() => setCurrentPage(page => page + 1)}>Next</button>
                                            </li>
                                        </ul>
                                    </nav>
                                )}
                                {error && <p className="text-danger text-center">{String(error)}</p>}
                            </>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
};

export default AllProducts;
