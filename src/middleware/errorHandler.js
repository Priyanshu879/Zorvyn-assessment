const { z } = require('zod');
const ZodError = z.ZodError;
const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';

  // Zod validation error
  if (err instanceof ZodError) {
    const details = {};
    err.issues.forEach((e) => {
      const field = e.path.join('.') || 'root';
      details[field] = e.message;
    });
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details,
        ...(isDev && { stack: err.stack }),
      },
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = {};
    Object.values(err.errors).forEach((e) => {
      details[e.path] = e.message;
    });
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details,
        ...(isDev && { stack: err.stack }),
      },
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid ID format',
        ...(isDev && { stack: err.stack }),
      },
    });
  }

  // MongoDB duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: {
        message: `Duplicate value for ${field}`,
        ...(isDev && { stack: err.stack }),
      },
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid token',
        ...(isDev && { stack: err.stack }),
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Token expired',
        ...(isDev && { stack: err.stack }),
      },
    });
  }

  // AppError (operational errors)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        ...(err.details && { details: err.details }),
        ...(isDev && { stack: err.stack }),
      },
    });
  }

  // Unknown / programmer errors
  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      ...(isDev && { stack: err.stack }),
    },
  });
};

module.exports = errorHandler;
