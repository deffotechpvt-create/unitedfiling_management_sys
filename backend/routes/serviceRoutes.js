const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleCheckMiddleware');
const { ROLES } = require('../config/constants');

// All service routes are protected
router.use(protect);

// Publicly viewable by all authenticated users
router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getServiceById);

// Admin-only management routes
router.post('/', checkRole(ROLES.SUPER_ADMIN), serviceController.createService);
router.put('/:id', checkRole(ROLES.SUPER_ADMIN), serviceController.updateService);
router.delete('/:id', checkRole(ROLES.SUPER_ADMIN), serviceController.deleteService);

module.exports = router;
