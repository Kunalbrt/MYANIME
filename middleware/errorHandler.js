// ============================================
//  Middleware: Global Error Handler
// ============================================

const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`${err.name}: ${err.message}${err.stack ? '\n' + err.stack : ''}`);

  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';

  // ── Mongoose: bad ObjectId ────────────────
  if (err.name === 'CastError') {
    message    = `Resource not found (invalid id: ${err.value})`;
    statusCode = 404;
  }

  // ── Mongoose: duplicate key ───────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message    = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    statusCode = 409;
  }

  // ── Mongoose: validation error ────────────
  if (err.name === 'ValidationError') {
    message    = Object.values(err.errors).map(e => e.message).join('. ');
    statusCode = 400;
  }

  // ── JWT errors ────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    message    = 'Invalid token.';
    statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    message    = 'Token expired. Please log in again.';
    statusCode = 401;
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Include stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;