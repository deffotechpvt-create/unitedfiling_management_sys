// utils/generateToken.js
const jwt = require('jsonwebtoken');

/**
 * Generate JWT token with userId and role
 * @param {String} userId - User ID
 * @param {String} role - User role (SUPER_ADMIN, ADMIN, CLIENT)
 * @returns {String} JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    {
      id: userId,
      role: role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

/**
 * Set JWT token in HTTP-only cookie
 * @param {Object} res - Express response object
 * @param {String} token - JWT token
 */
const setTokenCookie = (res, token) => {
  const options = {
    httpOnly: true, // Prevents XSS attacks
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
  };

  res.cookie('token', token, options);
};

/**
 * Clear token cookie (for logout)
 * @param {Object} res - Express response object
 */
const clearTokenCookie = (res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
};

module.exports = { generateToken, setTokenCookie, clearTokenCookie };
