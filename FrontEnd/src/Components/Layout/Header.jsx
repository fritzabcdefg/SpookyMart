import React, { useState, useEffect } from 'react'
import '../../App.css'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import { getUser, logout } from '../Utils/helpers';
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../actions/userActions'

import Search from './Search'
export const Header = () => {
    const dispatch = useDispatch();
    const { user, loading } = useSelector(state => state.auth)
    const { cartItems } = useSelector(state => state.cart)
    // const [user, setUser] = useState({})
    const navigate = useNavigate()

    const logoutHandler = () => {
        dispatch(logout());
        toast.success('Logged out!', {
            position: 'bottom-right'
        });
    }

    return (
        <>
            <nav className="navbar row">
                <div className="col-12 col-md-3">
                    <div className="navbar-brand">
                        <Link to="/">
                            <img src="/images/spookymart-logo.svg" alt="SpookyMart" />
                        </Link>
                    </div>
                </div>

                <Search />

                <div className="products-nav">
                    <Link to="/products">Products</Link>
                </div>

                <div className="col-12 col-md-3 mt-4 mt-md-0 text-center">
                    <div
                        className="header-account-cart"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {user ? (
                            <div className="dropdown d-inline">
                                <Link
                                    to="#!"
                                    className="btn dropdown-toggle text-white"
                                    type="button"
                                    id="dropDownMenuButton"
                                    data-toggle="dropdown"
                                    aria-haspopup="true"
                                    aria-expanded="false"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '7px',
                                        margin: 0
                                    }}
                                >
                                    <figure className="avatar avatar-nav">
                                        <img
                                            src={user.avatar && user.avatar.url}
                                            alt={user && user.name}
                                            className="rounded-circle"
                                        />
                                    </figure>
                                    <span>{user && user.name}</span>
                                </Link>

                                <div className="dropdown-menu" aria-labelledby="dropDownMenuButton">
                                    {user && user.role === 'admin' && (
                                        <Link className="dropdown-item" to="/dashboard">Dashboard</Link>
                                    )}
                                    <Link className="dropdown-item" to="/orders/me">Orders</Link>
                                    <Link className="dropdown-item" to="/me">Profile</Link>
                                    <Link
                                        className="dropdown-item text-danger"
                                        to="/"
                                        onClick={logoutHandler}
                                    >
                                        Logout
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <Link to="/login" className="btn" id="login_btn">Login</Link>
                        )}

                        <Link
                            to="/cart"
                            className="cart-nav-link"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                margin: 0,
                                textDecoration: 'none'
                            }}
                            aria-label={`Cart, ${cartItems ? cartItems.length : 0} items`}
                        >
                            <span id="cart">Cart</span>
                            <span id="cart_count">{cartItems ? cartItems.length : 0}</span>
                        </Link>
                    </div>
                </div>
            </nav>
        </>
    )
}