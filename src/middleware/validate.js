// src/middleware/validate.js
// Validation rules and a middleware to return errors from express-validator.

const { body, validationResult } = require('express-validator');

const bookCreateRules = [
  body('title').notEmpty().withMessage('Title is required'),
  body('author').notEmpty().withMessage('Author is required'),
  body('genre').optional().isString(),
  body('year').optional().isInt({ min: 0 }).withMessage('Year must be a positive integer'),
  body('copiesAvailable').optional().isInt({ min: 0 }).withMessage('Copies available must be 0 or more'),
];

const bookUpdateRules = [
  // for update allow all fields to be optional but validate if present
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('author').optional().notEmpty().withMessage('Author cannot be empty'),
  body('year').optional().isInt({ min: 0 }).withMessage('Year must be a positive integer'),
  body('copiesAvailable').optional().isInt({ min: 0 }).withMessage('Copies available must be 0 or more'),
];

// this is our middleware to collect validation errors and return a 400 if any
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  bookCreateRules,
  bookUpdateRules,
  validate,
};