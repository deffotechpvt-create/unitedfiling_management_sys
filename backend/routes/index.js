const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const setupRoutes = require('./setupRoutes');
const userRoutes = require('./userRoutes');
const clientRoutes = require('./clientRoutes');
const companyRoutes = require('./companyRoutes');

const complianceRoutes = require('./complianceRoutes');
const serviceRoutes = require('./serviceRoutes');
const reportRoutes = require('./reportRoutes');
const consultationRoutes = require('./consultationRoutes');
const documentRoutes = require('./documentRoutes');

// Register route

router.use('/auth', authRoutes);
router.use('/setup', setupRoutes);
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);
router.use('/companies', companyRoutes);
router.use('/compliances', complianceRoutes);
router.use('/services', serviceRoutes);
router.use('/reports', reportRoutes);
router.use('/consultations', consultationRoutes);
router.use('/documents', documentRoutes);

// Health check for API
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
