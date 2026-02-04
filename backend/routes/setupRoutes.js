// routes/setupRoutes.js
const express = require('express');
const router = express.Router();
const { setupSuperAdmin } = require('../controllers/setupController');
const { validateRequest } = require('../middleware/validatorMiddleware');
const Joi = require('joi');

// Validation schema
const setupSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  setupKey: Joi.string().required(),
});

// Setup route
router.post('/super-admin', validateRequest(setupSchema), setupSuperAdmin);

module.exports = router;
