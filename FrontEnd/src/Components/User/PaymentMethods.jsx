
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

import MetaData from '../Layout/MetaData';

const API = import.meta.env.VITE_API;

const PaymentMethods = () => {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [label, setLabel] = useState('My Card');
    const [cardholderName, setCardholderName] = useState('');
    const [brand, setBrand] = useState('Visa');
    const [last4, setLast4] = useState('');
    const [expiryMonth, setExpiryMonth] = useState('');
    const [expiryYear, setExpiryYear] = useState('');

    const getPaymentMethods = async () => {
        try {
            const { data } = await axios.get(
                `${API}/customer/me`,
                { withCredentials: true }
            );

            setPaymentMethods(data.customer?.paymentMethods || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Could not load saved payment methods.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getPaymentMethods();
    }, []);

    const addPaymentMethod = async (e) => {
        e.preventDefault();

        setSaving(true);
        setError('');
        setMessage('');

        try {
            const { data } = await axios.post(
                `${API}/customer/me/payment-methods`,
                {
                    label,
                    cardholderName,
                    brand,
                    last4,
                    expiryMonth: Number(expiryMonth),
                    expiryYear: Number(expiryYear),
                    isDefault: paymentMethods.length === 0
                },
                { withCredentials: true }
            );

            setPaymentMethods(data.paymentMethods || []);

            setLabel('My Card');
            setCardholderName('');
            setBrand('Visa');
            setLast4('');
            setExpiryMonth('');
            setExpiryYear('');

            setMessage('Payment method saved successfully.');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Could not save payment method.'
            );
        } finally {
            setSaving(false);
        }
    };

    const setDefault = async (id) => {
        setError('');
        setMessage('');

        try {
            const { data } = await axios.put(
                `${API}/customer/me/payment-methods/${id}/default`,
                {},
                { withCredentials: true }
            );

            setPaymentMethods(data.paymentMethods || []);
            setMessage('Default payment method updated.');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Could not update default payment method.'
            );
        }
    };

    const deletePaymentMethod = async (id) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this saved card?'
        );

        if (!confirmed) return;

        setError('');
        setMessage('');

        try {
            const { data } = await axios.delete(
                `${API}/customer/me/payment-methods/${id}`,
                { withCredentials: true }
            );

            setPaymentMethods(data.paymentMethods || []);
            setMessage('Payment method deleted.');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Could not delete payment method.'
            );
        }
    };

    if (loading) {
        return <h3 className="text-center mt-5">Loading payment methods...</h3>;
    }

    return (
        <>
            <MetaData title="Saved Payment Methods" />

            <div className="container mt-5 mb-5">
                <h2>My Payment Methods</h2>

                <Link to="/me" className="btn btn-secondary mb-4">
                    Back to Profile
                </Link>

                {message && (
                    <div className="alert alert-success">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                <h4>Saved Cards</h4>

                {paymentMethods.length === 0 ? (
                    <p>You have no saved payment methods.</p>
                ) : (
                    <div className="row mb-5">
                        {paymentMethods.map(card => (
                            <div
                                className="col-12 col-md-6 mb-3"
                                key={card._id}
                            >
                                <div className="card shadow-sm">
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

                                        <p>
                                            Expires: {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
                                        </p>

                                        {card.isDefault && (
                                            <span className="badge badge-success">
                                                Default
                                            </span>
                                        )}

                                        <div className="mt-3">
                                            {!card.isDefault && (
                                                <button
                                                    type="button"
                                                    className="btn btn-primary btn-sm mr-2"
                                                    onClick={() => setDefault(card._id)}
                                                >
                                                    Set as Default
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                onClick={() => deletePaymentMethod(card._id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <hr />

                <h4 className="mt-4">Add a Card</h4>

                <div className="row">
                    <div className="col-12 col-lg-6">
                        <form
                            className="shadow-lg p-4"
                            onSubmit={addPaymentMethod}
                        >
                            <div className="form-group">
                                <label htmlFor="card_label">
                                    Card Label
                                </label>
                                <input
                                    id="card_label"
                                    type="text"
                                    className="form-control"
                                    value={label}
                                    onChange={e => setLabel(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="cardholder_name">
                                    Cardholder Name
                                </label>
                                <input
                                    id="cardholder_name"
                                    type="text"
                                    className="form-control"
                                    value={cardholderName}
                                    onChange={e => setCardholderName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="card_brand">
                                    Card Brand
                                </label>
                                <select
                                    id="card_brand"
                                    className="form-control"
                                    value={brand}
                                    onChange={e => setBrand(e.target.value)}
                                >
                                    <option value="Visa">Visa</option>
                                    <option value="Mastercard">Mastercard</option>
                                    <option value="American Express">American Express</option>
                                    <option value="JCB">JCB</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="last4">
                                    Last Four Digits
                                </label>
                                <input
                                    id="last4"
                                    type="text"
                                    className="form-control"
                                    value={last4}
                                    onChange={e => setLast4(
                                        e.target.value.replace(/\D/g, '').slice(0, 4)
                                    )}
                                    inputMode="numeric"
                                    pattern="[0-9]{4}"
                                    maxLength="4"
                                    placeholder="1234"
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group col-6">
                                    <label htmlFor="expiry_month">
                                        Expiry Month
                                    </label>
                                    <select
                                        id="expiry_month"
                                        className="form-control"
                                        value={expiryMonth}
                                        onChange={e => setExpiryMonth(e.target.value)}
                                        required
                                    >
                                        <option value="">Month</option>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                            <option key={month} value={month}>
                                                {String(month).padStart(2, '0')}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group col-6">
                                    <label htmlFor="expiry_year">
                                        Expiry Year
                                    </label>
                                    <input
                                        id="expiry_year"
                                        type="number"
                                        className="form-control"
                                        value={expiryYear}
                                        onChange={e => setExpiryYear(e.target.value)}
                                        min={new Date().getFullYear()}
                                        max={new Date().getFullYear() + 20}
                                        placeholder="2028"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="alert alert-info">
                                Only card metadata is saved. Never enter your
                                full card number or CVV here.
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-block"
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Card'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PaymentMethods;
