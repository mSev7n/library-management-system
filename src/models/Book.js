// src/models/Book.js
// this is a Mongoose model representing a book in the library.

const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Please add an author'],
      trim: true,
    },
    genre: {
      type: String,
      trim: true,
      default: 'General',
    },
    year: {
      type: Number,
    },
    // number of copies available for borrowing
    copiesAvailable: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
    // maybe later we can add coverImageUrl, description, whatever, etc.
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model('Book', BookSchema);