const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/complianceController');
const { protect } = require('../middleware/authMiddleware');

// All compliance routes are protected
router.use(protect);

router.get('/', complianceController.getAllCompliances);
router.get('/stats', complianceController.getComplianceStats);

module.exports = router;
