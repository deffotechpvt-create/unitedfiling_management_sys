require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();


const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode`);
  console.log(`📡 Server listening on port ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log('='.repeat(50));
  console.log('');
  console.log('📋 Phase 1: Authentication Module');
  console.log('✅ Models: User, Client');
  console.log('✅ Routes: /api/auth/*');
  console.log('⚠️  Cloudflare R2: Disabled (Phase 4)');
  console.log('⚠️  Brevo Email: ' + (process.env.BREVO_API_KEY ? 'Configured' : 'Disabled (Optional)'));
  console.log('');
  console.log('='.repeat(50));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});
