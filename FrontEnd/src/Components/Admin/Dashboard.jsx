import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';

import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'
import { getToken } from '../Utils/helpers';
import axios from 'axios'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProductSalesChart from './ProductSalesChart';
import UserSalesChart from './UserSalesChart';
import MonthlySalesChart from './MonthlySalesChart';
import DateRangeSalesChart from './DateRangeSalesChart';
import { useDispatch, useSelector } from 'react-redux'


const Dashboard = () => {
    const { loading, error, products } = useSelector(state => state.products)

    // const [products, setProducts] = useState([])
    // const [error, setError] = useState('')
    // const [users, setUsers] = useState([])
    // const [orders, setOrders] = useState([])
    // const [loading, setLoading] = useState(false)
    // const [totalAmount, setTotalAmount] = useState([])
    let outOfStock = 0;
    // products.forEach(product => {
    //     if (product.stock === 0) {
    //         outOfStock += 1;
    //     }
    // })
    // const getAdminProducts = async () => {
    //     try {

    //         const config = {
    //             headers: {
    //                 'Authorization': `Bearer ${getToken()}`
    //             }
    //         }

    //         const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/products`, config)
    //         console.log(data)
    //         setProducts(data.products)
    //         setLoading(false)
    //     } catch (error) {

    //         setError(error.response.data.message)

    //     }
    // }

    // useEffect(() => {
    //     getAdminProducts()
    //     // allOrders()
    //     // allUsers()
    // }, [])


return (
    <>
        <div className="row">

            {/* Sidebar */}
            <div className="col-12 col-md-2">
                <Sidebar />
            </div>

            {/* Dashboard Content */}
            <div className="col-12 col-md-10">

                <h1 className="my-4">Dashboard</h1>

                {loading ? (
                    <Loader />
                ) : (
                    <>
                        <MetaData title="Admin Dashboard" />

                        {/* Total Amount Card */}
                        <div className="row pr-4">
                            <div className="col-xl-12 col-sm-12 mb-3">
                                <div className="card text-white bg-primary o-hidden h-100">
                                    <div className="card-body">
                                        {/* Total Amount content */}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dashboard Summary Cards */}
                        <div className="row pr-4">

                            {/* Products */}
                            <div className="col-xl-3 col-sm-6 mb-3">
                                <div className="card text-white bg-success o-hidden h-100">
                                    <div className="card-body">
                                        <div className="text-center card-font-size">
                                            Products<br />
                                            <b>{products && products.length}</b>
                                        </div>
                                    </div>

                                    <Link
                                        className="card-footer text-white clearfix small z-1"
                                        to="/admin/products"
                                    >
                                        <span className="float-left">View Details</span>
                                        <span className="float-right">
                                            <i className="fa fa-angle-right"></i>
                                        </span>
                                    </Link>
                                </div>
                            </div>

                            {/* Orders */}
                            <div className="col-xl-3 col-sm-6 mb-3">
                                <div className="card text-white bg-danger o-hidden h-100">
                                    <Link
                                        className="card-footer text-white clearfix small z-1"
                                        to="/admin/orders"
                                    >
                                        <span className="float-left">View Details</span>
                                        <span className="float-right">
                                            <i className="fa fa-angle-right"></i>
                                        </span>
                                    </Link>
                                </div>
                            </div>

                            {/* Users */}
                            <div className="col-xl-3 col-sm-6 mb-3">
                                <div className="card text-white bg-info o-hidden h-100">
                                    <Link
                                        className="card-footer text-white clearfix small z-1"
                                        to="/admin/users"
                                    >
                                        <span className="float-left">View Details</span>
                                        <span className="float-right">
                                            <i className="fa fa-angle-right"></i>
                                        </span>
                                    </Link>
                                </div>
                            </div>

                            {/* Out of Stock */}
                            <div className="col-xl-3 col-sm-6 mb-3">
                                <div className="card text-white bg-warning o-hidden h-100">
                                    <div className="card-body">
                                        <div className="text-center card-font-size">
                                            Out of Stock<br />
                                            <b>{outOfStock}</b>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </>
                )}

                {/* Sales Charts */}
                <div className="dashboard mt-4">

                    <ProductSalesChart />

                    <UserSalesChart />

                    <MonthlySalesChart />

                    <DateRangeSalesChart />

                </div>

            </div>
        </div>
    </>
);
}

export default Dashboard