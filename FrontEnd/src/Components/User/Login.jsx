
import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { firebaseAuth } from '../../firebase';

import Loader from '../Layout/Loader';
import MetaData from '../Layout/MetaData';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { login, clearErrors } from '../../actions/userActions';

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

    const googleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();

            const result = await signInWithPopup(firebaseAuth, provider);
            const idToken = await result.user.getIdToken();

            const response = await fetch(
                `${import.meta.env.VITE_API}/auth/firebase`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ idToken })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Google login failed');
            }

            window.location.reload();
        } catch (error) {
            console.error('Google login error:', error);
            toast.error(error.message || 'Unable to login with Google');
        }
    };

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

    const showError = field =>
        formik.touched[field] && formik.errors[field];

    return (
        <>
            {loading ? (
                <Loader />
            ) : (
                <>
                    <MetaData title="Login" />

                    <div className="row wrapper">
                        <div className="col-10 col-lg-5">
                            <form
                                className="shadow-lg"
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
                                    className="btn btn-block py-3"
                                    disabled={loading}
                                >
                                    LOGIN
                                </button>

                                <div className="text-center my-3">
                                    <span>OR</span>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-block py-3"
                                    onClick={googleLogin}
                                >
                                    <i className="fab fa-google mr-2"></i>
                                    Continue with Google
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
