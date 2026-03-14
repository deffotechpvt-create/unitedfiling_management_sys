// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getAllAdmins,
  createAdmin,
  getUserById,
  updateUserStatus,
  deleteUser,
  getAdminUtilization,
  getServerStats,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleCheckMiddleware');
const { validateRequest } = require('../middleware/validatorMiddleware');
const {
  createAdminSchema,
  updateUserStatusSchema,
} = require('../validators/userValidator');

// All routes require authentication
router.use(protect);

// Admin-specific routes (MUST come before generic /:id routes)
router.get('/admins/for-assignment', checkRole('SUPER_ADMIN', 'ADMIN'), require('../controllers/userController').getAdminsForAssignment);
router.get('/admins', checkRole('SUPER_ADMIN'), getAllAdmins);
router.post('/admins', checkRole('SUPER_ADMIN'), validateRequest(createAdminSchema), createAdmin);
router.get('/admins/:id', checkRole('SUPER_ADMIN'), getUserById);
router.get('/admins/:id/utilization', checkRole('SUPER_ADMIN'), getAdminUtilization);
router.patch('/admins/:id/status', checkRole('SUPER_ADMIN'), validateRequest(updateUserStatusSchema), updateUserStatus);
router.delete('/admins/:id', checkRole('SUPER_ADMIN'), deleteUser);
router.get('/servers/stats', checkRole('SUPER_ADMIN'), getServerStats);

// General user routes
router.get('/', checkRole('SUPER_ADMIN', 'ADMIN'), getAllUsers);
router.get('/:id', checkRole('SUPER_ADMIN', 'ADMIN'), getUserById);
router.patch('/:id/status', checkRole('SUPER_ADMIN'), validateRequest(updateUserStatusSchema), updateUserStatus);
router.delete('/:id', checkRole('SUPER_ADMIN'), deleteUser);
module.exports = router;
