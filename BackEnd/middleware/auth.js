
const User = require('../models/user');
const jwt = require('jsonwebtoken');

exports.isAuthenticatedUser = async (req, res, next) => {
    try {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Login first to access this resource.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User account not found.'
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: 'This account is no longer active.'
            });
        }

        req.user = user;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired login session.'
        });
    }
};

exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to access this resource.'
            });
        }

        next();
    };
};
