import React, { useState, useEffect } from 'react'
import Product from './Product/Product'
import MetaData from './Layout/MetaData'
import axios from 'axios'

const Home = () => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    // 1. Defined the fetch function cleanly
    const getProducts = async () => {
        try {
            let link = `http://localhost:4001/api/v1/products`
            let res = await axios.get(link)
            
            console.log("Fetched Products:", res.data.products)
            setProducts(res.data.products || []) // Fallback to an empty array if undefined
        } catch (error) {
            console.error("Error fetching products:", error)
        } finally {
            setLoading(false)
        }
    }
    //changed some below, last commit product details
    useEffect(() => {
        getProducts()
    }, []);

    return (
        <>
            <MetaData title={'Shop Here'} />

            <div className="container container-fluid">
                <h1 id="products_heading">Latest Products</h1>
                <section id="products" className="container mt-5">
                    <div className="row">
                        {loading ? (
                            <h2>Loading SpookyMart Items...</h2>
                        ) : products && products.length > 0 ? (
                            products.map(product => (
                                <Product key={product._id} product={product} />
                            ))
                        ) : (
                            <h3>No products found in SpookyMart database.</h3>
                        )}
                    </div>
                </section>
            </div>
        </>
    )
}

export default Home
