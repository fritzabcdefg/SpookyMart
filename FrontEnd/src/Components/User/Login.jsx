
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

                                    <input
                                        type="password"
                                        id="password_field"
                                        name="password"
                                        className="form-control"
                                        value={formik.values.password}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />

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

                                <button
                                    type="button"
                                    className="btn btn-block py-3 mb-3 login-social-button login-facebook-button"
                                    style={{ backgroundColor: '#1877F2', color: '#ffffff' }}
                                    disabled={socialLoading || loading}
                                    onClick={() => socialLogin('facebook')}
                                >
                                    Continue with Facebook
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
                    </div>
                </>
            )}
        </>
    );
};

export default Login;
