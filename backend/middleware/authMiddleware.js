// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * Protect routes - Verify JWT from cookie
 */
exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in cookies (PRIMARY)
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    // Fallback: Check Authorization header (for testing/mobile apps)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // No token found
    if (!token) {
        throw new ApiError(401, 'Not authorized, no token provided');
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Get user from token (exclude password)
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            throw new ApiError(401, 'User not found');
        }

        // Verify role matches (security check)
        if (req.user.role !== decoded.role) {
            throw new ApiError(403, 'Role mismatch, please login again');
        }
        // Add decoded role to req.user for easy access
        req.user.tokenRole = decoded.role;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new ApiError(401, 'Invalid token');
        }
        if (error.name === 'TokenExpiredError') {
            throw new ApiError(401, 'Token expired, please login again');
        }
        throw error;
    }
});
