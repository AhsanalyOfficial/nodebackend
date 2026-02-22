import dotenv from 'dotenv';

dotenv.config();

// Development error response
const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.message,
      status: err.status
    },
    timestamp: new Date().toISOString()
  });
};

// Production error response
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.statusCode
      },
      timestamp: new Date().toISOString()
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Something went wrong!'
      },
      timestamp: new Date().toISOString()
    });
  }
};

// Handle specific Prisma errors
const handlePrismaError = (err) => {
  // Unique constraint violation
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return {
      statusCode: 400,
      message: `${field} already exists. Please use another value.`,
      isOperational: true
    };
  }
  
  // Foreign key constraint
  if (err.code === 'P2003') {
    return {
      statusCode: 400,
      message: 'Referenced record does not exist',
      isOperational: true
    };
  }
  
  // Record not found
  if (err.code === 'P2025') {
    return {
      statusCode: 404,
      message: 'Record not found',
      isOperational: true
    };
  }
  
  return null;
};

// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle Prisma errors
  const prismaError = handlePrismaError(err);
  if (prismaError) {
    err.statusCode = prismaError.statusCode;
    err.message = prismaError.message;
    err.isOperational = true;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    err.statusCode = 401;
    err.message = 'Invalid token. Please log in again.';
    err.isOperational = true;
  }
  
  if (err.name === 'TokenExpiredError') {
    err.statusCode = 401;
    err.message = 'Your token has expired. Please log in again.';
    err.isOperational = true;
  }

  // Validation errors from express-validator
  if (err.message.startsWith('[') && err.message.includes('field')) {
    try {
      const errors = JSON.parse(err.message);
      err.statusCode = 400;
      err.message = 'Validation failed';
      err.errors = errors;
      err.isOperational = true;
    } catch (e) {
      // Not a JSON error, continue
    }
  }

  // Send response based on environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};

// 404 handler for unmatched routes
export const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.statusCode = 404;
  error.isOperational = true;
  next(error);
};