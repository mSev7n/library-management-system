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
    }
    },
    {
      timestamps: true, // createdAt, updatedAt
    }
);

module.exports = mongoose.model('Book', BookSchema);