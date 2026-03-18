const express = require('express');
const router = express.Router();
const googleCalendarController = require('../controllers/googleCalendarController');
const { protect } = require('../middleware/authMiddleware');

// 1. Google Auth & Auto-Sync Routes
// Generates URL and redirects to Google Consent Screen OR auto-syncs if already connected
router.get('/auth', protect, googleCalendarController.googleAuth);

// Handles the redirect callback from Google and triggers initial sync
router.get('/auth/callback', googleCalendarController.googleAuthCallback);

// 2. Google Session Management Routes
// Check if the user is currently connected securely
router.get('/status', protect, googleCalendarController.googleSyncStatus);

// Revokes tokens, clears DB, and removes all pushed events
router.post('/disconnect', protect, googleCalendarController.disconnectGoogle);

// 3. Google Calendar Webhook Listener
// This endpoint must be public (no 'protect' middleware) because Google calls it directly
router.post('/webhook', googleCalendarController.googleWebhookCallback);

module.exports = router;
