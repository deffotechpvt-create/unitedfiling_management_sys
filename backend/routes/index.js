const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const setupRoutes = require('./setupRoutes');
const userRoutes = require('./userRoutes');
const clientRoutes = require('./clientRoutes');
const companyRoutes = require('./companyRoutes');

// In the routes section


// Register route

router.use('/auth', authRoutes);
router.use('/setup', setupRoutes);
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);
router.use('/companies', companyRoutes);

// Health check for API
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
