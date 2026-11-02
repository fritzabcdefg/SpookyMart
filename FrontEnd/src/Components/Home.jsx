import React, { useEffect, useRef, useState } from 'react';
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
    const loadMoreRef = useRef(null);
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
    const totalPages = Math.max(1, Math.ceil(totalProducts / resPerPage));
    const requestedPage = ((currentPage - 1) % totalPages) + 1;
    const canLoadProducts = totalProducts > 0;

    useEffect(() => {
        setCurrentPage(1);
    }, [keyword, price]);

    useEffect(() => {
        dispatch(getProducts(requestedPage, keyword || '', price, '', 0, 0, currentPage > 1));
    }, [dispatch, currentPage, keyword, price]);

    useEffect(() => {
        const target = loadMoreRef.current;
        if (!target || !canLoadProducts || loading) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !loading && canLoadProducts) {
                    setCurrentPage(page => page + 1);
                }
            },
            { root: null, rootMargin: '300px', threshold: 0 }
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [canLoadProducts, loading, products.length]);

    const handlePriceChange = (event, newValue) => {
        setPrice(newValue);
        setCurrentPage(1);
    };

    const priceText = value => `₱${value.toLocaleString()}`;

    return (
        <>
            <MetaData title="Shop Here - SpookyMart" />
            <div className="container container-fluid">
                <h1 id="products_heading">{keyword ? `Search Results for "${keyword}"` : 'Latest Products'}</h1>

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
                                        sx={{ color: '#ff6600' }}
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

                            <div ref={loadMoreRef} className="text-center py-4" aria-live="polite">
                                {loading && <Loader />}
                                {!loading && canLoadProducts && <span>Keep scrolling — more spooky finds are loading...</span>}
                                {error && <p className="text-danger">{String(error)}</p>}
                            </div>
                        </>
                    )}
                </section>
            </div>
        </>
    );
};

export default Home;
