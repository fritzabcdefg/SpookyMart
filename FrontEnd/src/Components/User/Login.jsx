
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import Loader from '../Layout/Loader';
import MetaData from '../Layout/MetaData';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { login, clearErrors } from '../../actions/userActions';

import { GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from '../../firebase';
import axios from 'axios';
import { LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAIL } from '../../constants/userConstants';
import { loadCartForUser } from '../../actions/cartActions';
import './PasswordVisibility.css';


const loginSchema = Yup.object({
    email: Yup.string()
        .trim()
        .email('Please enter a valid email address')
        .required('Email is required'),

    password: Yup.string()
        .required('Password is required')
        .min(6, 'Password must be at least 6 characters')
});

const Login = () => {
    const {
        isAuthenticated,
        error,
        loading
    } = useSelector(state => state.auth);

    const [socialLoading, setSocialLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const redirect = location.search
        ? new URLSearchParams(location.search).get('redirect')
        : '';

    const formik = useFormik({
        initialValues: {
            email: '',
            password: ''
        },

        validationSchema: loginSchema,

        onSubmit: values => {
            dispatch(login(values.email.trim(), values.password));
        }
    });

    useEffect(() => {
        if (new URLSearchParams(location.search).get('verified') === '1') {
            toast.success('Email verified! You can now log in.');
        }
        if (new URLSearchParams(location.search).get('verification') === 'pending') {
            toast.info('Registration successful! Check your email and verify your account before logging in.');
        }
        if (isAuthenticated && redirect === 'shipping') {
            navigate(`/${redirect}`);
        } else if (isAuthenticated) {
            navigate('/');
        }

        if (error) {
            toast.error(error);
            dispatch(clearErrors());
        }
    }, [error, isAuthenticated, dispatch, navigate, redirect]);


    const socialLogin = async (providerName) => {
        if (!isFirebaseConfigured || !firebaseAuth) {
            toast.error('Firebase is not configured. Add the Firebase web settings to FrontEnd/.env.');
            return;
        }

        setSocialLoading(true);
        dispatch({ type: LOGIN_REQUEST });
        try {
            const provider = providerName === 'google'
                ? new GoogleAuthProvider()
                : new FacebookAuthProvider();
            if (providerName === 'google') {
                provider.setCustomParameters({ prompt: 'select_account' });
            } else {
                provider.addScope('email');
            }

            const result = await signInWithPopup(firebaseAuth, provider);
            const idToken = await result.user.getIdToken();
            const { data } = await axios.post(
                `${import.meta.env.VITE_API}/auth/firebase`,
                { idToken },
                { withCredentials: true }
            );

            dispatch({ type: LOGIN_SUCCESS, payload: data.user });
            if (data.user?._id) dispatch(loadCartForUser(data.user._id));
            toast.success(`Signed in with ${providerName === 'google' ? 'Google' : 'Facebook'}!`);
        } catch (err) {
            console.error('Social login error:', err);
            dispatch({
                type: LOGIN_FAIL,
                payload: err.response?.data?.message || err.message || 'Social sign-in failed.'
            });
        } finally {
            setSocialLoading(false);
        }
    };

    const showError = field =>
        formik.touched[field] && formik.errors[field];

    return (
        <>
            {loading ? (
                <Loader />
            ) : (
                <>
                    <MetaData title="Login" />

                    <div className="login-page">
                        <div className="login-card-column">
                            <form
                                className="shadow-lg login-form"
                                onSubmit={formik.handleSubmit}
                                noValidate
                            >
                                <h1 className="mb-3">Login</h1>

                                <div className="form-group">
                                    <label htmlFor="email_field">
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        id="email_field"
                                        name="email"
                                        className="form-control"
                                        value={formik.values.email}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />

                                    {showError('email') && (
                                        <small className="text-danger">
                                            {formik.errors.email}
                                        </small>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="password_field">
                                        Password
                                    </label>

                                    <div className="password-input-wrap">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="password_field"
                                            name="password"
                                            className="form-control password-input"
                                            value={formik.values.password}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            className="password-visibility-toggle"
                                            onClick={() => setShowPassword(value => !value)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            aria-pressed={showPassword}
                                            title={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? (
                                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8"/><path d="M9.9 5.2A10.8 10.8 0 0112 5c5.2 0 9 5.1 10 7-.4.8-1.5 2.3-3.5 3.8M6.2 6.2C3.8 7.7 2.4 10 2 12c1 1.9 4.8 7 10 7 1.1 0 2.1-.2 3-.6"/></svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
                                            )}
                                        </button>
                                    </div>

                                    {showError('password') && (
                                        <small className="text-danger">
                                            {formik.errors.password}
                                        </small>
                                    )}
                                </div>

                                <Link
                                    to="/password/forgot"
                                    className="float-right mb-4"
                                >
                                    Forgot Password?
                                </Link>

                                <button
                                    id="login_button"
                                    type="submit"
                                    className="btn btn-block py-3 login-submit-button"
                                    disabled={loading}
                                >
                                    LOGIN
                                </button>


                                <div className="text-center my-3">
                                    <span>OR CONTINUE WITH</span>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-block py-3 mb-2 login-social-button login-google-button"
                                    style={{ backgroundColor: '#ffffff', color: '#333333', border: '1px solid #cccccc' }}
                                    disabled={socialLoading || loading}
                                    onClick={() => socialLogin('google')}
                                >
                                    <strong>G</strong> &nbsp; Continue with Google
                                </button>
                                <Link
                                    to="/register"
                                    className="float-right mt-3"
                                >
                                    New User?
                                </Link>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default Login;
