// src/routes/books.js
// Express router for /api/books endpoints.

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

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

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // folder where images will be saved
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

// our list + search
router.get('/', getBooks);

// create
router.post(
  '/',
  upload.single('coverImage'), // handles image upload
  bookCreateRules,
  validate,
  createBook
);

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
