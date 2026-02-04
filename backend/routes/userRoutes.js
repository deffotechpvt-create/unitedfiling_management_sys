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
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleCheckMiddleware');
const { validateRequest } = require('../middleware/validatorMiddleware');
const {
  createAdminSchema,
  updateUserStatusSchema,
} = require('../validators/userValidator');

// All routes require authentication and SUPER_ADMIN role
router.use(protect);
router.use(checkRole('SUPER_ADMIN'));

// Admin-specific routes (MUST come before generic /:id routes)
router.get('/admins', getAllAdmins);
router.post('/admins', validateRequest(createAdminSchema), createAdmin);
router.get('/admins/:id', getUserById); // ✅ ADDED
router.get('/admins/:id/utilization', getAdminUtilization);
router.patch('/admins/:id/status', validateRequest(updateUserStatusSchema), updateUserStatus); // ✅ ADDED
router.delete('/admins/:id', deleteUser); // ✅ ADDED

// General user routes
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.patch('/:id/status', validateRequest(updateUserStatusSchema), updateUserStatus);
router.delete('/:id', deleteUser);

module.exports = router;
