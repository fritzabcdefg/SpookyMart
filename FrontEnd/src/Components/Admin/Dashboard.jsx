import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import MetaData from '../Layout/MetaData';
import Sidebar from './SideBar';

import ProductSalesChart from './ProductSalesChart';
import MonthlySalesChart from './MonthlySalesChart';
import DateRangeSalesChart from './DateRangeSalesChart';

import { getAdminProducts } from '../../actions/productActions';
import { allOrders } from '../../actions/orderActions';
import { allUsers } from '../../actions/userActions';
import './SalesCharts.css';

const Dashboard = () => {
    const dispatch = useDispatch();

    const { products = [], loading: productsLoading } =
        useSelector(state => state.products || {});

    const { orders = [], totalAmount, loading: ordersLoading } =
        useSelector(state => state.allOrders || {});

    const { users = [], loading: usersLoading } =
        useSelector(state => state.allUsers || {});

    useEffect(() => {
        dispatch(getAdminProducts(false));
        dispatch(allOrders());
        dispatch(allUsers());
    }, [dispatch]);

    const productCount = products.length;
    const orderCount = orders.length;
    const userCount = users.length;

    const outOfStock = products.filter(
        product => Number(product.stock) <= 0
    ).length;

    const formatCurrency = amount =>
        `₱${Number(amount || 0).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    const summaryCards = [
        {
            title: 'Products',
            count: productsLoading ? '...' : productCount,
            icon: 'fa-cube',
            color: '#7c3aed',
            link: '/admin/products',
            footer: 'Manage Products'
        },
        {
            title: 'Orders',
            count: ordersLoading ? '...' : orderCount,
            icon: 'fa-shopping-bag',
            color: '#e04455',
            link: '/admin/orders',
            footer: 'View Orders'
        },
        {
            title: 'Users',
            count: usersLoading ? '...' : userCount,
            icon: 'fa-users',
            color: '#159db0',
            link: '/admin/users',
            footer: 'Manage Users'
        },
        {
            title: 'Out of Stock',
            count: productsLoading ? '...' : outOfStock,
            icon: 'fa-exclamation-triangle',
            color: '#d97706',
            link: '/admin/products',
            footer: 'Check Inventory'
        }
    ];

    return (
        <>
            <MetaData title="Admin Dashboard" />

            <div className="row">
                <div className="col-12 col-md-2">
                    <Sidebar />
                </div>

                <div className="col-12 col-md-10">
                    <main style={{ padding: '20px 24px' }}>
                        <h1
                            style={{
                                color: '#f5f0ff',
                                fontSize: '32px',
                                fontWeight: 700,
                                marginBottom: '25px'
                            }}
                        >
                            Dashboard
                        </h1>

                        {/* Total Sales */}
                        <div
                            style={{
                                background: 'linear-gradient(120deg, #21102f, #35104b)',
                                border: '1px solid #8b2be2',
                                borderRadius: '12px',
                                padding: '22px 26px',
                                marginBottom: '25px',
                                color: '#fff',
                                boxShadow: '0 5px 18px rgba(0,0,0,0.2)'
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '12px'
                                }}
                            >
                                <div>
                                    <p
                                        style={{
                                            margin: 0,
                                            color: '#c9a7e8',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Total Sales
                                    </p>

                                    <h2
                                        style={{
                                            margin: '6px 0 0',
                                            fontSize: '30px',
                                            fontWeight: 700,
                                            color: '#f8f4ff'
                                        }}
                                    >
                                        {ordersLoading
                                            ? 'Loading...'
                                            : formatCurrency(totalAmount)}
                                    </h2>
                                </div>

                                <div
                                    style={{
                                        width: '52px',
                                        height: '52px',
                                        borderRadius: '12px',
                                        background: 'rgba(168, 85, 247, 0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#d8b4fe',
                                        fontSize: '24px'
                                    }}
                                >
                                    <i className="fa fa-money" />
                                </div>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="row">
                            {summaryCards.map(card => (
                                <div
                                    className="col-12 col-sm-6 col-xl-3 mb-4"
                                    key={card.title}
                                >
                                    <div
                                        style={{
                                            height: '100%',
                                            minHeight: '155px',
                                            background: '#160d22',
                                            border: `1px solid ${card.color}`,
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            color: '#fff',
                                            boxShadow: '0 4px 14px rgba(0,0,0,0.18)'
                                        }}
                                    >
                                        <div
                                            style={{
                                                padding: '20px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: '10px'
                                            }}
                                        >
                                            <div>
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        color: '#c9bdd6',
                                                        fontSize: '14px'
                                                    }}
                                                >
                                                    {card.title}
                                                </p>

                                                <h2
                                                    style={{
                                                        margin: '7px 0 0',
                                                        fontSize: '28px',
                                                        fontWeight: 700,
                                                        color: '#f8f4ff'
                                                    }}
                                                >
                                                    {card.count}
                                                </h2>
                                            </div>

                                            <i
                                                className={`fa ${card.icon}`}
                                                style={{
                                                    color: card.color,
                                                    fontSize: '30px',
                                                    opacity: 0.9
                                                }}
                                            />
                                        </div>

                                        <Link
                                            to={card.link}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '11px 18px',
                                                background: card.color,
                                                color: '#fff',
                                                textDecoration: 'none',
                                                fontSize: '13px',
                                                fontWeight: 600
                                            }}
                                        >
                                            {card.footer}
                                            <i className="fa fa-arrow-right" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                    {/* Sales Charts */}
                    <div className="sales-charts-grid">
                        <ProductSalesChart />

                        <MonthlySalesChart />
                        <DateRangeSalesChart />

                    </div>
                    </main>
                </div>
            </div>
        </>
    );
};

export default Dashboard;