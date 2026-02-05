const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  logout,
  changePassword,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRegistration, validateLogin, validateChangePassword } = require('../validators/authValidator');

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/change-password', protect, validateChangePassword, changePassword);
router.put('/profile', protect, updateProfile);

module.exports = router;
