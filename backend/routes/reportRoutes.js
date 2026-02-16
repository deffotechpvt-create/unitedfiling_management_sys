const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleCheckMiddleware');
const constants = require('../config/constants');

// All report routes are restricted to SUPER_ADMIN
router.use(protect);
router.use(checkRole(constants.ROLES.SUPER_ADMIN));

router.get('/overview', reportController.getReportOverview);
router.get('/high-risk', reportController.getHighRiskCompliances);

module.exports = router;
