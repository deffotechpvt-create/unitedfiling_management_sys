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

const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'PRODUCTION' || process.env.NODE_ENV === 'prod';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax', // ✅ THIS is the only fix
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

const clearTokenCookie = (res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
};



module.exports = { generateToken, setTokenCookie, clearTokenCookie };
