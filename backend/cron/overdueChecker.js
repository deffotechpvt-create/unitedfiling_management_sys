// cron/overdueChecker.js
const cron = require('node-cron');
const CalendarEvent = require('../models/CalendarEvent');

/**
 * Overdue Checker Cron Job
 * Runs every day at midnight (12:00 AM)
 * Automatically marks pending calendar events as overdue
 * if their deadlineDate has passed
 */
const startOverdueChecker = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log(`[CRON] Running overdue checker at ${new Date().toISOString()}`);

    try {
      const result = await CalendarEvent.updateMany(
        {
          status: 'pending',
          deadlineDate: { $lt: new Date() },
        },
        {
          $set: { status: 'overdue' },
        }
      );

      console.log(`[CRON] Overdue checker done — ${result.modifiedCount} events marked as overdue`);
    } catch (error) {
      console.error('[CRON] Overdue checker failed:', error.message);
    }
  }, {
    timezone: 'Asia/Kolkata', // IST timezone for your Varanasi-based server
  });

  console.log('[CRON] Overdue checker scheduled — runs daily at midnight IST');
};

module.exports = startOverdueChecker;
