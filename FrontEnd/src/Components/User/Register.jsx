import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MetaData from '../Layout/MetaData';
import { useDispatch, useSelector } from 'react-redux';
import { clearErrors } from '../../actions/userActions';
import { toast } from 'react-toastify';
import './PasswordVisibility.css';

const Eye = ({ visible }) => visible ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8"/><path d="M9.9 5.2A10.8 10.8 0 0112 5c5.2 0 9 5.1 10 7-.4.8-1.5 2.3-3.5 3.8M6.2 6.2C3.8 7.7 2.4 10 2 12c1 1.9 4.8 7 10 7 1.1 0 2.1-.2 3-.6"/></svg>
) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
);

const Register = () => {
    const dispatch = useDispatch();
    const { isAuthenticated, error } = useSelector(state => state.auth);
    const [user, setUser] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const { name, email, password, confirmPassword } = user;

    useEffect(() => {
        if (isAuthenticated) navigate('/');
        if (error) { toast.error(error); dispatch(clearErrors()); }
    }, [error, navigate, isAuthenticated, dispatch]);

    const submitHandler = async e => {
        e.preventDefault();
        if (password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { toast.error('Passwords do not match.'); return; }

        setSubmitting(true);
        const formData = new FormData();
        formData.set('name', name.trim());
        formData.set('email', email.trim());
        formData.set('password', password);
        formData.set('confirmPassword', confirmPassword);

        try {
            await axios.post(`${import.meta.env.VITE_API}/register`, formData, { withCredentials: true });
            toast.success('Verification email sent! Please verify your email before logging in.');
            navigate('/login?verification=pending', { replace: true });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const onChange = e => setUser(old => ({ ...old, [e.target.name]: e.target.value }));

    return (
        <>
            <MetaData title="Register User" />
            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form className="shadow-lg" onSubmit={submitHandler}>
                        <h1 className="mb-3">Register</h1>
                        <div className="form-group">
                            <label htmlFor="name_field">Name</label>
                            <input type="text" id="name_field" className="form-control" name="name" value={name} onChange={onChange} maxLength={30} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="register_email_field">Email</label>
                            <input type="email" id="register_email_field" className="form-control" name="email" value={email} onChange={onChange} required autoComplete="email" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="register_password_field">Password</label>
                            <div className="password-input-wrap">
                                <input type={showPassword ? 'text' : 'password'} id="register_password_field" className="form-control password-input" name="password" value={password} onChange={onChange} minLength={6} required autoComplete="new-password" />
                                <button type="button" className="password-visibility-toggle" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}><Eye visible={showPassword} /></button>
                            </div>
                            <small className="text-muted">Password must contain at least 6 characters.</small>
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirm_password_field">Confirm Password</label>
                            <div className="password-input-wrap">
                                <input type={showConfirmPassword ? 'text' : 'password'} id="confirm_password_field" className="form-control password-input" name="confirmPassword" value={confirmPassword} onChange={onChange} minLength={6} required autoComplete="new-password" />
                                <button type="button" className="password-visibility-toggle" onClick={() => setShowConfirmPassword(v => !v)} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'} aria-pressed={showConfirmPassword}><Eye visible={showConfirmPassword} /></button>
                            </div>
                        </div>
                        <button id="register_button" type="submit" className="btn btn-block py-3" disabled={submitting}>
                            {submitting ? 'SENDING VERIFICATION EMAIL...' : 'REGISTER'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Register;
