import React from 'react'
import '../../App.css'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../actions/userActions'

import Search from './Search'

export const Header = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth)
    const { cartItems } = useSelector(state => state.cart)

    const logoutHandler = () => {
        dispatch(logout());
        toast.success('Logged out!', {
            position: 'bottom-right'
        });
    }

    return (
        <>
            <nav
                className="navbar row"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    rowGap: '12px'
                }}
            >
                <div
                    className="header-brand-search"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        flex: '1 1 560px',
                        minWidth: 0,
                        gap: 'clamp(14px, 2.5vw, 32px)'
                    }}
                >
                    <div className="navbar-brand" style={{ flex: '0 0 auto', margin: 0 }}>
                        <Link to="/">
                            <img src="/images/spookymart-logo.svg" alt="SpookyMart" />
                        </Link>
                    </div>

                    <div style={{ flex: '1 1 260px', minWidth: 0, maxWidth: '520px' }}>
                        <Search />
                    </div>
                </div>

                <div
                    className="products-nav"
                    style={{ flex: '0 0 auto', margin: '0 18px' }}
                >
                    <Link to="/products">Products</Link>
                </div>

                <div
                    className="header-actions"
                    style={{
                        flex: '0 1 auto',
                        marginLeft: 'auto',
                        textAlign: 'center'
                    }}
                >
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
