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

// Trust proxy to get correct IP behind Nginx/Heroku
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// ======================
// Security Middleware
// ======================
app.use(helmet()); // Security headers
// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
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
// Rate Limiting (Disabled in Development)
// ======================
if (process.env.NODE_ENV !== 'development') {
  const limiter = rateLimit({
    windowMs: constants.RATE_LIMIT.WINDOW_MS,
    max: constants.RATE_LIMIT.MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api', limiter);
  console.log('✅ Rate limiting enabled');
} else {
  console.log('⚠️  Rate limiting disabled (development mode)');
}


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
