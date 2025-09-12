// src/routes/books.js
// Express router for /api/books endpoints.

const express = require('express');
const router = express.Router();

const {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  borrowBook,
  returnBook,
} = require('../controllers/bookController');

const { bookCreateRules, bookUpdateRules, validate } = require('../middleware/validate');

// our list + search
router.get('/', getBooks);

// create
router.post('/', bookCreateRules, validate, createBook);

// single book
router.get('/:id', getBookById);

// update
router.put('/:id', bookUpdateRules, validate, updateBook);

// delete
router.delete('/:id', deleteBook);

// borrow / return
router.post('/:id/borrow', borrowBook);
router.post('/:id/return', returnBook);

module.exports = router;