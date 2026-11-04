import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';

import Product from './Product/Product';
import MetaData from './Layout/MetaData';
import Loader from './Layout/Loader';
import { getProducts } from '../actions/productActions';

const Home = () => {
    const [price, setPrice] = useState([1, 10000]);
    const [currentPage, setCurrentPage] = useState(1);
    const { keyword } = useParams();
    const dispatch = useDispatch();

    const {
        loading,
        error,
        products = [],
        productsCount = 0,
        filteredProductsCount = 0,
        resPerPage = 4
    } = useSelector(state => state.products || {});

    const totalProducts = keyword ? filteredProductsCount : productsCount;
    const totalPages = Math.ceil(totalProducts / resPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [keyword, price]);

    useEffect(() => {
        dispatch(getProducts(currentPage, keyword || '', price));
    }, [dispatch, currentPage, keyword, price]);

    const handlePriceChange = (event, newValue) => {
        setPrice(newValue);
        setCurrentPage(1);
    };

    const priceText = value => `₱${value.toLocaleString()}`;

    return (
        <>
            <MetaData title="SpookyMart" />
            <div className="container container-fluid home-page">
                <h1 id="products_heading">
                    {keyword ? `Search Results for "${keyword}"` : 'Latest Products'}
                </h1>

                <section id="products" className="container mt-5">
                    {keyword && (
                        <div className="row mb-4">
                            <div className="col-12 col-md-3">
                                <h4>Price Filter</h4>
                                <Box sx={{ width: '100%', px: 1 }}>
                                    <Slider
                                        getAriaLabel={() => 'Price Filter'}
                                        value={price}
                                        onChange={handlePriceChange}
                                        valueLabelDisplay="auto"
                                        min={1}
                                        max={10000}
                                        step={100}
                                        sx={{ color: '#ff852b' }}
                                    />
                                </Box>
                                <div className="d-flex justify-content-between">
                                    <span>{priceText(price[0])}</span>
                                    <span>{priceText(price[1])}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && products.length === 0 ? (
                        <div className="container mt-5">
                            <h3>Failed to load products</h3>
                            <p>{String(error)}</p>
                        </div>
                    ) : products.length === 0 && loading ? (
                        <Loader />
                    ) : products.length === 0 ? (
                        <div className="text-center py-5">
                            <h4>No products found</h4>
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
                </section>
            </div>
        </>
    );
};

export default Home;
