require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const startOverdueChecker = require('./cron/overdueChecker');

// Connect to MongoDB
connectDB().then(() => {
  // Start cron jobs only after DB is connected
  startOverdueChecker();
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode`);
  console.log(`📡 Server listening on port ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log('='.repeat(50));
  console.log('');
  console.log('📋 Phase 3: Advanced Features');
  console.log('✅ Models: User, Client, Company, Compliance, Consultation, Document, CalendarEvent');
  console.log('✅ Storage: Cloudinary Integrated');
  console.log('✅ Email: ' + (process.env.BREVO_API_KEY ? 'Configured (Brevo)' : 'Disabled (Optional)'));
  console.log('✅ Cron: Overdue Checker scheduled (daily midnight IST)');
  console.log('');
  console.log('='.repeat(50));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});
