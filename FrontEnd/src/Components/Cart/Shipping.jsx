
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { countries } from 'countries-list';
import axios from 'axios';
import MetaData from '../Layout/MetaData';
import CheckoutSteps from './CheckoutSteps';
import { useDispatch, useSelector } from 'react-redux';
import { saveShippingInfo } from '../../actions/cartActions';

const Shipping = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const shippingInfo = useSelector(
        state => state.cart.shippingInfo || {}
    );

    const API = import.meta.env.VITE_API;
    const countriesList = Object.values(countries).sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [saveAddress, setSaveAddress] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [recipientName, setRecipientName] = useState(
        shippingInfo.recipientName || ''
    );
    const [label, setLabel] = useState('Home');
    const [address, setAddress] = useState(shippingInfo.address || '');
    const [city, setCity] = useState(shippingInfo.city || '');
    const [postalCode, setPostalCode] = useState(
        shippingInfo.postalCode || ''
    );
    const [phoneNo, setPhoneNo] = useState(shippingInfo.phoneNo || '');
    const [country, setCountry] = useState(
        shippingInfo.country || 'Philippines'
    );

    useEffect(() => {
        let active = true;

        const loadAddresses = async () => {
            try {
                const { data } = await axios.get(`${API}/customer/me`, {
                    withCredentials: true
                });

                if (!active) return;

                const savedAddresses = data.customer?.addresses || [];
                setAddresses(savedAddresses);

                if (savedAddresses.length > 0) {
                    const defaultAddress =
                        savedAddresses.find(item => item.isDefault) ||
                        savedAddresses[0];

                    const currentMatch = savedAddresses.find(item =>
                        item.address === shippingInfo.address &&
                        item.city === shippingInfo.city &&
                        item.postalCode === shippingInfo.postalCode
                    );

                    const selected = currentMatch || defaultAddress;

                    setSelectedAddressId(selected._id);
                    setRecipientName(selected.recipientName || '');
                    setLabel(selected.label || 'Home');
                    setAddress(selected.address || '');
                    setCity(selected.city || '');
                    setPostalCode(selected.postalCode || '');
                    setPhoneNo(selected.phoneNo || '');
                    setCountry(selected.country || 'Philippines');
                }
            } catch (err) {
                // Guests can still enter shipping details manually.
                //console.log('No saved customer addresses available.');
            } finally {
                if (active) setLoadingAddresses(false);
            }
        };

        loadAddresses();

        return () => {
            active = false;
        };
    }, []);

    const selectSavedAddress = (addressId) => {
        setSelectedAddressId(addressId);
        setSaveAddress(false);
        setError('');

        const selected = addresses.find(item => item._id === addressId);

        if (!selected) return;

        setRecipientName(selected.recipientName || '');
        setLabel(selected.label || 'Home');
        setAddress(selected.address || '');
        setCity(selected.city || '');
        setPostalCode(selected.postalCode || '');
        setPhoneNo(selected.phoneNo || '');
        setCountry(selected.country || 'Philippines');
    };

    const useNewAddress = () => {
        setSelectedAddressId('');
        setSaveAddress(false);
        setRecipientName('');
        setLabel('Home');
        setAddress('');
        setCity('');
        setPostalCode('');
        setPhoneNo('');
        setCountry('Philippines');
        setError('');
    };

    const submitHandler = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError('');

            const shippingData = {
                recipientName,
                label,
                address,
                city,
                postalCode,
                phoneNo,
                country
            };

            // Save a newly entered address only when the checkbox is selected.
            if (!selectedAddressId && saveAddress) {
                const { data } = await axios.post(
                    `${API}/customer/me/addresses`,
                    {
                        ...shippingData,
                        isDefault: addresses.length === 0
                    },
                    { withCredentials: true }
                );

                setAddresses(data.addresses || []);
            }

            dispatch(saveShippingInfo(shippingData));
            navigate('/confirm');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to save your address. Please try again.'
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <MetaData title="Shipping Info - SpookyMart" />
            <CheckoutSteps shipping />

            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form
                        className="shadow-lg"
                        onSubmit={submitHandler}
                    >
                        <h1 className="mb-4">Shipping Info</h1>

                        {error && (
                            <div className="alert alert-danger">
                                {error}
                            </div>
                        )}

                        {loadingAddresses ? (
                            <p>Loading saved addresses...</p>
                        ) : addresses.length > 0 ? (
                            <div className="form-group">
                                <label htmlFor="savedAddress">
                                    Choose a Saved Address
                                </label>

                                <select
                                    id="savedAddress"
                                    className="form-control"
                                    value={selectedAddressId}
                                    onChange={e =>
                                        selectSavedAddress(e.target.value)
                                    }
                                >
                                    {addresses.map(item => (
                                        <option
                                            key={item._id}
                                            value={item._id}
                                        >
                                            {item.label} - {item.address}, {item.city}
                                            {item.isDefault ? ' (Default)' : ''}
                                        </option>
                                    ))}
                                </select>

                                <button
                                    type="button"
                                    className="btn btn-link px-0"
                                    onClick={useNewAddress}
                                >
                                    + Enter a different address
                                </button>
                            </div>
                        ) : (
                            <p className="text-muted">
                                You do not have any saved addresses yet.
                            </p>
                        )}

                        <div className="form-group">
                            <label htmlFor="recipient_field">
                                Recipient Name
                            </label>
                            <input
                                type="text"
                                id="recipient_field"
                                className="form-control"
                                value={recipientName}
                                onChange={e => {
                                    setRecipientName(e.target.value);
                                    setSelectedAddressId('');
                                }}
                                required
                            />
                        </div>

                        {!selectedAddressId && (
                            <div className="form-group">
                                <label htmlFor="label_field">
                                    Address Label
                                </label>
                                <select
                                    id="label_field"
                                    className="form-control"
                                    value={label}
                                    onChange={e => setLabel(e.target.value)}
                                >
                                    <option value="Home">Home</option>
                                    <option value="Work">Work</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="address_field">
                                Complete Address
                            </label>
                            <input
                                type="text"
                                id="address_field"
                                className="form-control"
                                placeholder="House number, street, barangay"
                                value={address}
                                onChange={e => {
                                    setAddress(e.target.value);
                                    setSelectedAddressId('');
                                }}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="city_field">City</label>
                            <input
                                type="text"
                                id="city_field"
                                className="form-control"
                                value={city}
                                onChange={e => {
                                    setCity(e.target.value);
                                    setSelectedAddressId('');
                                }}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone_field">Phone Number</label>
                            <input
                                type="tel"
                                id="phone_field"
                                className="form-control"
                                value={phoneNo}
                                onChange={e => {
                                    setPhoneNo(e.target.value);
                                    setSelectedAddressId('');
                                }}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="postal_code_field">
                                Postal Code
                            </label>
                            <input
                                type="text"
                                id="postal_code_field"
                                className="form-control"
                                value={postalCode}
                                onChange={e => {
                                    setPostalCode(e.target.value);
                                    setSelectedAddressId('');
                                }}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="country_field">Country</label>
                            <select
                                id="country_field"
                                className="form-control"
                                value={country}
                                onChange={e => {
                                    setCountry(e.target.value);
                                    setSelectedAddressId('');
                                }}
                                required
                            >
                                {countriesList.map(item => (
                                    <option
                                        key={item.name}
                                        value={item.name}
                                    >
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {!selectedAddressId && (
                            <div className="form-group">
                                <div className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="saveAddress"
                                        checked={saveAddress}
                                        onChange={e =>
                                            setSaveAddress(e.target.checked)
                                        }
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor="saveAddress"
                                    >
                                        Save this address to my Address Book
                                    </label>
                                </div>
                            </div>
                        )}

                        <button
                            id="shipping_btn"
                            type="submit"
                            className="btn btn-block py-3"
                            disabled={saving}
                        >
                            {saving ? 'PLEASE WAIT...' : 'CONTINUE'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Shipping;
