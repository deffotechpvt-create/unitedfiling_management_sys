const express = require('express');
const router = express.Router();
const {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  assignClientToAdmin,
  unassignClient,
  getUnassignedClients,
  getClientStats,
} = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleCheckMiddleware');

// Protect all routes
router.use(protect);

// Stats route (SUPER_ADMIN & ADMIN)
router.get('/stats/overview', checkRole('SUPER_ADMIN', 'ADMIN'), getClientStats);

// Unassigned clients (SUPER_ADMIN only)
router.get('/unassigned/list', checkRole('SUPER_ADMIN'), getUnassignedClients);

// Assignment routes (SUPER_ADMIN only)
router.post('/:id/assign', checkRole('SUPER_ADMIN'), assignClientToAdmin);
router.post('/:id/unassign', checkRole('SUPER_ADMIN'), unassignClient);

// CRUD routes (SUPER_ADMIN & ADMIN)
router.route('/')
  .get(checkRole('SUPER_ADMIN', 'ADMIN'), getAllClients)
  .post(checkRole('SUPER_ADMIN', 'ADMIN'), createClient);

router.route('/:id')
  .get(checkRole('SUPER_ADMIN', 'ADMIN'), getClientById)
  .put(checkRole('SUPER_ADMIN', 'ADMIN'), updateClient)
  .delete(checkRole('SUPER_ADMIN'), deleteClient); // Only SUPER_ADMIN can delete

module.exports = router;
