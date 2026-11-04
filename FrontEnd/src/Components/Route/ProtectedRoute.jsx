import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from '../Layout/Loader';

const ProtectedRoute = ({ children, isAdmin = false }) => {
    const { isAuthenticated, loading, user } = useSelector(state => state.auth);
    if (loading !== false) return <Loader />;
    if (!isAuthenticated || !user) return <Navigate to="/" replace />;
    if (isAdmin && user.role !== 'admin') return <Navigate to="/" replace />;
    return children;
};

export default ProtectedRoute;
