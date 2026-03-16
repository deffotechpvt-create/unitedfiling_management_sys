// routes/calendarRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleCheckMiddleware');
const {
  getClientCalendar,
  getUpcomingDeadlines,
  updateEventStatus,
  getClientCalendarByAdmin,
  getAdminCalendar
} = require('../controllers/calendarController');

// ───────────────────────────────────────────
// USER Routes (Client Dashboard)
// ───────────────────────────────────────────

// GET /api/calendar — get all events for logged-in client
router.get('/', protect, checkRole('USER'), getClientCalendar);

// GET /api/calendar/upcoming — get upcoming deadlines (next 30 days)
router.get('/upcoming', protect, checkRole('USER'), getUpcomingDeadlines);

// ───────────────────────────────────────────
// ADMIN / SUPER_ADMIN Routes
// ───────────────────────────────────────────

// GET /api/calendar/client/:clientId — admin views a specific client's calendar
router.get('/client/:clientId', protect, checkRole('ADMIN', 'SUPER_ADMIN'), getClientCalendarByAdmin);

// PUT /api/calendar/:id/status — update event status
router.put('/:id/status', protect, checkRole('ADMIN', 'SUPER_ADMIN'), updateEventStatus);
// GET /api/calendar/admin — Admin views all clients' events
router.get('/admin', protect, checkRole('ADMIN', 'SUPER_ADMIN'), getAdminCalendar);


module.exports = router;
