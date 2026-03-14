const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const { protect } = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleCheckMiddleware');
const constants = require('../config/constants');

// Apply protection to all consultation routes
router.use(protect);

/**
 * User Booking Routes
 */
router.post('/create-order', checkRole(constants.ROLES.USER), consultationController.createOrder);
router.post('/verify-payment', checkRole(constants.ROLES.USER), consultationController.verifyPayment);
router.post('/:id/refund', checkRole(constants.ROLES.SUPER_ADMIN), consultationController.refundPayment);

/**
 * General Consultations Access
 */
router.get('/', consultationController.getMyConsultations);
router.get('/:id', consultationController.getConsultationById);
router.post('/:id/messages', consultationController.addMessage);

/**
 * Admin Management Routes
 */
router.patch(
    '/:id/assign',
    checkRole(constants.ROLES.SUPER_ADMIN),
    consultationController.assignExpert
);

router.patch(
    '/:id/status',
    checkRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
    consultationController.updateStatus
);

module.exports = router;
