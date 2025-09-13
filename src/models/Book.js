// src/models/Book.js
// this is a Mongoose model representing a book in the library.

const mongoose = require('mongoose');

// sub-schema for borrowers
const BorrowerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  borrowedAt: {
    type: Date,
    default: Date.now,
  },
  copies: {    //  added this to track number of copies per borrower
    type: Number,
    required: true,
    default: 1,
    min: 1
  }
});

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
      required: true,
    },
    // number of copies available for borrowing
    copiesAvailable: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
    coverImage: {
      type: String, // URL/path of uploaded image
      default: ""
    },
    coverColor: {
      type: String, // fallback if no image
      default: "#3498db" // default color
    },
    // list of borrowers who borrowed this book
    borrowers: [BorrowerSchema],
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model('Book', BookSchema);