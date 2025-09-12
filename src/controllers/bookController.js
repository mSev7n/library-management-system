// src/controllers/bookController.js
// controller functions for book-related routes (CRUD, borrow/return, list with search/filter) type shi

const Book = require('../models/Book');

// @desc    Create a new book
// @route   POST /api/books
// @access  Public (for simplicity)
const createBook = async (req, res, next) => {
  try {
    const { title, author, genre, year, copiesAvailable } = req.body;

    const book = await Book.create({
      title,
      author,
      genre,
      year,
      copiesAvailable: copiesAvailable ?? 1,
    });

    res.status(201).json({ success: true, data: book });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all books with optional search/filter/pagination
// @route   GET /api/books
const getBooks = async (req, res, next) => {
  try {
    const { q, genre, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const query = {};

    // text-like search
    if (q) {
      // simple regex search on title and author
      const reg = new RegExp(q, 'i');
      query.$or = [{ title: reg }, { author: reg }, { genre: reg }];
    }

    if (genre) {
      query.genre = genre;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const books = await Book.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Book.countDocuments(query);

    res.json({
      success: true,
      count: books.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: books,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single book by ID
// @route   GET /api/books/:id
const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      const error = new Error('Book not found');
      error.statusCode = 404;
      throw error;
    }
    res.json({ success: true, data: book });
  } catch (err) {
    next(err);
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
const updateBook = async (req, res, next) => {
  try {
    const updates = req.body;
    const book = await Book.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!book) {
      const error = new Error('Book not found');
      error.statusCode = 404;
      throw error;
    }

    res.json({ success: true, data: book });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      const error = new Error('Book not found');
      error.statusCode = 404;
      throw error;
    }
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// @desc    Borrow a book (decrement copiesAvailable if > 0)
// @route   POST /api/books/:id/borrow
const borrowBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      const error = new Error('Book not found');
      error.statusCode = 404;
      throw error;
    }

    if (book.copiesAvailable <= 0) {
      return res.status(400).json({ success: false, message: 'No copies available to borrow' });
    }

    book.copiesAvailable -= 1;
    await book.save();

    res.json({ success: true, data: book });
  } catch (err) {
    next(err);
  }
};

// @desc    Return a book (increment copiesAvailable)
// @route   POST /api/books/:id/return
const returnBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      const error = new Error('Book not found');
      error.statusCode = 404;
      throw error;
    }

    book.copiesAvailable += 1;
    await book.save();

    res.json({ success: true, data: book });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  borrowBook,
  returnBook,
};

// omoooooooo