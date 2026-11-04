
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';

import Loader from '../Layout/Loader';
import MetaData from '../Layout/MetaData';

const Profile = () => {
    const { user, loading } = useSelector(state => state.auth);

    const [customer, setCustomer] = useState(null);
    const [customerLoading, setCustomerLoading] = useState(true);
    const [customerError, setCustomerError] = useState('');

    useEffect(() => {
        const getCustomer = async () => {
            try {
                const { data } = await axios.get(
                    `${import.meta.env.VITE_API}/customer/me`,
                    { withCredentials: true }
                );

                setCustomer(data.customer || null);
            } catch (error) {
                console.error(
                    'Could not load customer information:',
                    error.response?.data || error.message
                );

                setCustomerError(
                    error.response?.data?.message ||
                    'Could not load saved addresses and payment methods.'
                );
            } finally {
                setCustomerLoading(false);
            }
        };

        getCustomer();
    }, []);

    if (loading) return <Loader />;

    if (!user) {
        return (
            <div className="container mt-5">
                <h3>Please log in to view your profile.</h3>
                <Link to="/login" className="btn btn-primary mt-3">
                    Login
                </Link>
            </div>
        );
    }

    const addresses = customer?.addresses || [];
    const paymentMethods = customer?.paymentMethods || [];

    return (
        <>
            <MetaData title="Your Profile" />

            <div className="container mt-5 mb-5 profile-page">
                <div className="profile-page-heading"><h2>My Profile</h2><p>Manage your account details, shipping addresses, and payment methods.</p></div>

                <div className="row mt-4 user-info profile-overview">
                    <div className="col-12 col-md-4 col-lg-3 text-center profile-sidebar">
                        <figure className="avatar avatar-profile">
                            <img
                                className="rounded-circle img-fluid"
                                src={
                                    user.avatar?.url ||
                                    '/images/default_avatar.jpg'
                                }
                                alt={user.name}
                            />
                        </figure>

                        <Link
                            to="/me/update"
                            className="btn btn-primary btn-block my-3 profile-action-btn"
                        >
                            Edit Profile
                        </Link>
                    </div>

                    <div className="col-12 col-md-8 col-lg-9 profile-details">
                        <h4>Full Name</h4>
                        <p>{user.name}</p>

                        <h4>Email Address</h4>
                        <p>{user.email}</p>

                        <h4>Joined On</h4>
                        <p>
                            {user.createdAt
                                ? String(user.createdAt).substring(0, 10)
                                : 'Not available'}
                        </p>

                        {user.role !== 'admin' && (
                            <Link
                                to="/orders/me"
                                className="btn btn-danger btn-block mt-3 profile-action-btn profile-orders-btn"
                            >
                                My Orders
                            </Link>
                        )}

                        <Link
                            to="/password/update"
                            className="btn btn-primary btn-block mt-3 profile-action-btn"
                        >
                            Change Password
                        </Link>
                    </div>
                </div>

                <hr className="my-5" />

                <div className="row">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center flex-wrap mb-3 profile-section-header">
                            <h3>My Shipping Addresses</h3>
                            <Link
                                to="/shipping"
                                className="btn btn-primary profile-action-btn"
                            >
                                Add Address at Checkout
                            </Link>
                            <Link to="/me/addresses" className="btn btn-outline-primary profile-action-btn profile-outline-btn">
                                Manage Addresses
                            </Link>
                        </div>

                        {customerLoading ? (
                            <p>Loading saved addresses...</p>
                        ) : customerError ? (
                            <div className="alert alert-warning">
                                {customerError}
                            </div>
                        ) : addresses.length === 0 ? (
                            <p>You have no saved shipping addresses yet.</p>
                        ) : (
                            <div className="row">
                                {addresses.map(address => (
                                    <div
                                        className="col-12 col-md-6 mb-3"
                                        key={address._id}
                                    >
                                        <div className="card h-100 profile-data-card">
                                            <div className="card-body">
                                                <h5>
                                                    {address.label || 'Address'}
                                                    {address.isDefault && (
                                                        <span className="badge badge-success ml-2">
                                                            Default
                                                        </span>
                                                    )}
                                                </h5>

                                                <p className="mb-1">
                                                    {address.recipientName}
                                                </p>

                                                <p className="mb-1">
                                                    {address.address}
                                                </p>

                                                <p className="mb-1">
                                                    {address.city}, {address.postalCode}
                                                </p>

                                                <p className="mb-1">
                                                    {address.country}
                                                </p>

                                                <p className="mb-0">
                                                    {address.phoneNo}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <hr className="my-5" />

                <div className="row">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center flex-wrap mb-3">
                            <h3>My Payment Methods</h3>

                            <Link
                                to="/me/payment-methods"
                                className="btn btn-primary"
                            >
                                Manage Payment Methods
                            </Link>
                        </div>

                        {customerLoading ? (
                            <p>Loading payment methods...</p>
                        ) : paymentMethods.length === 0 ? (
                            <p>You have no saved payment methods.</p>
                        ) : (
                            <div className="row">
                                {paymentMethods.map(card => (
                                    <div
                                        className="col-12 col-md-6 mb-3"
                                        key={card._id}
                                    >
                                        <div className="card h-100">
                                            <div className="card-body">
                                                <h5>
                                                    {card.brand} ending in {card.last4}
                                                </h5>

                                                <p className="mb-1">
                                                    {card.cardholderName}
                                                </p>

                                                <p className="mb-1">
                                                    {card.label}
                                                </p>

                                                <p className="mb-1">
                                                    Expires: {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
                                                </p>

                                                {card.isDefault && (
                                                    <span className="badge badge-success">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Profile;
