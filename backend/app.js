const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const constants = require('./config/constants');

// Import routes
const routes = require('./routes');

// Import middleware
const errorHandlerMiddleware = require('./middleware/errorHandlerMiddleware');

const app = express();

// ======================
// Security Middleware
// ======================
app.use(helmet()); // Security headers

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// ======================
// General Middleware
// ======================
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser());

// Logging (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ======================
// Rate Limiting
// ======================
const limiter = rateLimit({
  windowMs: constants.RATE_LIMIT.WINDOW_MS,
  max: constants.RATE_LIMIT.MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// ======================
// Health Check
// ======================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ======================
// API Routes
// ======================
app.use('/api', routes);

// ======================
// 404 Handler
// ======================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ======================
// Global Error Handler
// ======================
app.use(errorHandlerMiddleware);

module.exports = app;
