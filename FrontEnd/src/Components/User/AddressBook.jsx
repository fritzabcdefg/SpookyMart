
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import MetaData from '../Layout/MetaData';

const API = import.meta.env.VITE_API;

const emptyAddress = {
    label: 'Home',
    recipientName: '',
    phoneNo: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Philippines',
    isDefault: false
};

const AddressBook = () => {
    const [addresses, setAddresses] = useState([]);
    const [formData, setFormData] = useState(emptyAddress);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const getAddresses = async () => {
        try {
            setLoading(true);
            setError('');

            const { data } = await axios.get(`${API}/customer/me`, {
                withCredentials: true
            });

            setAddresses(data.customer?.addresses || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load your saved addresses.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getAddresses();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const resetForm = () => {
        setFormData(emptyAddress);
        setEditingId(null);
        setError('');
    };

    const handleEdit = (address) => {
        setEditingId(address._id);

        setFormData({
            label: address.label || 'Home',
            recipientName: address.recipientName || '',
            phoneNo: address.phoneNo || '',
            address: address.address || '',
            city: address.city || '',
            postalCode: address.postalCode || '',
            country: address.country || 'Philippines',
            isDefault: address.isDefault || false
        });

        setMessage('');
        setError('');

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError('');
            setMessage('');

            let response;

            if (editingId) {
                response = await axios.put(
                    `${API}/customer/me/addresses/${editingId}`,
                    formData,
                    { withCredentials: true }
                );
            } else {
                response = await axios.post(
                    `${API}/customer/me/addresses`,
                    formData,
                    { withCredentials: true }
                );
            }

            setAddresses(response.data.addresses || []);
            setMessage(response.data.message || 'Address saved successfully.');
            resetForm();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to save your address.'
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (addressId) => {
        if (!window.confirm('Are you sure you want to delete this address?')) {
            return;
        }

        try {
            setError('');
            setMessage('');

            const { data } = await axios.delete(
                `${API}/customer/me/addresses/${addressId}`,
                { withCredentials: true }
            );

            setAddresses(data.addresses || []);
            setMessage(data.message || 'Address deleted.');

            if (editingId === addressId) {
                resetForm();
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to delete this address.'
            );
        }
    };

    const handleSetDefault = async (addressId) => {
        try {
            setError('');
            setMessage('');

            const { data } = await axios.put(
                `${API}/customer/me/addresses/${addressId}/default`,
                {},
                { withCredentials: true }
            );

            setAddresses(data.addresses || []);
            setMessage(data.message || 'Default address updated.');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to update the default address.'
            );
        }
    };

    return (
        <>
            <MetaData title="Address Book - SpookyMart" />

            <div className="container my-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2>My Address Book</h2>
                        <p className="text-muted mb-0">
                            Manage your saved shipping addresses.
                        </p>
                    </div>

                    <Link to="/me" className="btn btn-outline-secondary">
                        Back to Profile
                    </Link>
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="alert alert-success" role="alert">
                        {message}
                    </div>
                )}

                <div className="card shadow-sm mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">
                            {editingId ? 'Edit Address' : 'Add New Address'}
                        </h5>
                    </div>

                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">
                                        Address Label
                                    </label>
                                    <select
                                        className="form-control"
                                        name="label"
                                        value={formData.label}
                                        onChange={handleChange}
                                    >
                                        <option value="Home">Home</option>
                                        <option value="Work">Work</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label className="form-label">
                                        Recipient Name
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="recipientName"
                                        value={formData.recipientName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label className="form-label">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        className="form-control"
                                        name="phoneNo"
                                        value={formData.phoneNo}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label className="form-label">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="col-12 mb-3">
                                    <label className="form-label">
                                        Complete Address
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="address"
                                        placeholder="House number, street, barangay"
                                        value={formData.address}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label className="form-label">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label className="form-label">
                                        Postal Code
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="postalCode"
                                        value={formData.postalCode}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="col-12 mb-3">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="isDefault"
                                            name="isDefault"
                                            checked={formData.isDefault}
                                            onChange={handleChange}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor="isDefault"
                                        >
                                            Set as my default shipping address
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                            >
                                {saving
                                    ? 'Saving...'
                                    : editingId
                                        ? 'Update Address'
                                        : 'Save Address'}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    className="btn btn-secondary ml-2"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </button>
                            )}
                        </form>
                    </div>
                </div>

                <h4 className="mb-3">Saved Addresses</h4>

                {loading ? (
                    <p>Loading addresses...</p>
                ) : addresses.length === 0 ? (
                    <div className="alert alert-info">
                        You have no saved addresses yet.
                    </div>
                ) : (
                    <div className="row">
                        {addresses.map(address => (
                            <div className="col-md-6 mb-3" key={address._id}>
                                <div className="card h-100 shadow-sm">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h5 className="mb-0">
                                                {address.label || 'Address'}
                                            </h5>

                                            {address.isDefault && (
                                                <span className="badge badge-success">
                                                    Default
                                                </span>
                                            )}
                                        </div>

                                        <p className="mb-1">
                                            <strong>{address.recipientName}</strong>
                                        </p>

                                        <p className="mb-1">{address.phoneNo}</p>
                                        <p className="mb-1">{address.address}</p>
                                        <p className="mb-1">
                                            {address.city}, {address.postalCode}
                                        </p>
                                        <p className="mb-3">{address.country}</p>

                                        <div className="d-flex flex-wrap">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary mr-2 mb-2"
                                                onClick={() => handleEdit(address)}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger mr-2 mb-2"
                                                onClick={() => handleDelete(address._id)}
                                            >
                                                Delete
                                            </button>

                                            {!address.isDefault && (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-success mb-2"
                                                    onClick={() => handleSetDefault(address._id)}
                                                >
                                                    Set as Default
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default AddressBook;
