const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const setupRoutes = require('./setupRoutes'); 
const userRoutes = require('./userRoutes');

router.use('/auth', authRoutes);
router.use('/setup', setupRoutes);
router.use('/users', userRoutes);

// Health check for API
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
