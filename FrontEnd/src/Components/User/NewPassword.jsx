import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import MetaData from '../Layout/MetaData';
import { toast } from 'react-toastify';
import axios from 'axios';
import './PasswordRecovery.css';

const NewPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { token } = useParams();

    const submitHandler = async (event) => {
        event.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Your password must be at least 6 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Your passwords do not match.');
            return;
        }

        try {
            setLoading(true);
            const { data } = await axios.put(
                `${import.meta.env.VITE_API}/password/reset/${token}`,
                { password, confirmPassword },
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (data.success) {
                toast.success('Your password has been updated. Please log in with your new password.');
                navigate('/login', { replace: true });
            }
        } catch (requestError) {
            const message = requestError.response?.data?.message ||
                'This reset link is invalid or has expired. Please request a new one.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <MetaData title="Reset Password - SpookyMart" />
            <main className="password-recovery-page">
                <section className="password-recovery-card">
                    <div className="password-recovery-mark" aria-hidden="true">✦</div>
                    <p className="password-recovery-eyebrow">ACCOUNT SECURITY</p>
                    <h1>Create a new password</h1>
                    <p className="password-recovery-copy">
                        Choose a strong password you haven’t used for SpookyMart before.
                    </p>

                    {error && <p className="password-recovery-error" role="alert">{error}</p>}

                    <form onSubmit={submitHandler}>
                        <label htmlFor="new-password">New password</label>
                        <div className="password-recovery-input-wrap">
                            <input
                                id="new-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={event => setPassword(event.target.value)}
                                placeholder="At least 6 characters"
                                autoComplete="new-password"
                                minLength={6}
                                required
                            />
                            <button type="button" className="password-recovery-eye" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        <label htmlFor="confirm-new-password">Confirm new password</label>
                        <div className="password-recovery-input-wrap">
                            <input
                                id="confirm-new-password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={event => setConfirmPassword(event.target.value)}
                                placeholder="Enter your password again"
                                autoComplete="new-password"
                                minLength={6}
                                required
                            />
                            <button type="button" className="password-recovery-eye" onClick={() => setShowConfirmPassword(value => !value)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                                {showConfirmPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        <p className="password-recovery-hint">Use at least 6 characters.</p>
                        <button type="submit" disabled={loading}>
                            {loading ? 'Updating password…' : 'Save new password'}
                        </button>
                    </form>

                    <Link className="password-recovery-back" to="/login">← Back to login</Link>
                </section>
            </main>
        </>
    );
};

export default NewPassword;
