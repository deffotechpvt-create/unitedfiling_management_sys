const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  logout,
  updateProfile,
  forgotPassword,
  resetPassword,
  updateOnboardingTask,
  completeOnboarding,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRegistration, validateLogin} = require('../validators/authValidator');

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/profile', protect, updateProfile);
router.patch('/onboarding/:task', protect, updateOnboardingTask);
router.post('/onboarding/complete', protect, completeOnboarding);

module.exports = router;
