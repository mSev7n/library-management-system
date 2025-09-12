// src/middleware/errorHandler.js
// Centralized error handling middleware for Express.

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // set a default status code
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Server Error',
  });
};

module.exports = errorHandler;