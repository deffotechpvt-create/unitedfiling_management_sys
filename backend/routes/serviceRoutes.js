const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');

// All service routes are protected to ensure only authenticated users see offerings
router.use(protect);

router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getServiceById);

module.exports = router;
