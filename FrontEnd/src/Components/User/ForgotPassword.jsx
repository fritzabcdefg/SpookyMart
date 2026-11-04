import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import MetaData from '../Layout/MetaData';
import { forgotPassword } from '../../actions/userActions';
import './PasswordRecovery.css';

const ForgotPassword = () => {
    const dispatch = useDispatch();
    const { error, loading, message } = useSelector(state => state.forgotPassword);
    const [email, setEmail] = useState('');

    const submitHandler = (event) => {
        event.preventDefault();
        dispatch(forgotPassword(email.trim()));
    };

    return (
        <>
            <MetaData title="Forgot Password - SpookyMart" />
            <main className="password-recovery-page">
                <section className="password-recovery-card">
                    <div className="password-recovery-mark" aria-hidden="true">✦</div>
                    <p className="password-recovery-eyebrow">SPOOKYMART ACCOUNT</p>
                    <h1>Forgot your password?</h1>
                    <p className="password-recovery-copy">
                        No worries! Enter the email address linked to your account and
                        we’ll send you a secure link to create a new password.
                    </p>

                    {message && (
                        <div className="password-recovery-notice" role="status">
                            <strong>Check your inbox</strong>
                            <span>{message}</span>
                        </div>
                    )}
                    {error && <p className="password-recovery-error" role="alert">{error}</p>}

                    {!message && (
                        <form onSubmit={submitHandler}>
                            <label htmlFor="recovery-email">Email address</label>
                            <input
                                id="recovery-email"
                                type="email"
                                value={email}
                                onChange={event => setEmail(event.target.value)}
                                placeholder="you@example.com"
                                autoComplete="email"
                                required
                            />
                            <button type="submit" disabled={loading || !email.trim()}>
                                {loading ? 'Sending link…' : 'Send reset link'}
                            </button>
                        </form>
                    )}

                    <Link className="password-recovery-back" to="/login">← Back to login</Link>
                    <p className="password-recovery-footnote">
                        For your security, reset links expire after 30 minutes.
                    </p>
                </section>
            </main>
        </>
    );
};

export default ForgotPassword;
