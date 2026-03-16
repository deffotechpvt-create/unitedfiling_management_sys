const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Apply protection
router.use(protect);

/**
 * @desc    Create Razorpay Order for any entity
 * @route   POST /api/payments/create-order
 */
router.post('/create-order', paymentController.createOrder);

/**
 * @desc    Verify Payment
 * @route   POST /api/payments/verify-payment
 */
router.post('/verify-payment', paymentController.verifyPayment);

module.exports = router;
