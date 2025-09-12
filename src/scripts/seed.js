// src/scripts/seed.js
// Run with: npm run seed
// to fill the database with sample book data
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Book = require('../models/Book');

(async () => {
  try {
     console.log("Connecting to DB:", process.env.MONGO_URI);
    await connectDB();


    // clear current
    console.log("Clearing old data...");
    await Book.deleteMany({});

    const sample = [
      { title: '1984', author: 'George Orwell', genre: 'Dystopian', year: 1949, copiesAvailable: 3 },
      { title: 'Clean Code', author: 'Robert C. Martin', genre: 'Programming', year: 2008, copiesAvailable: 2 },
      { title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Fiction', year: 1988, copiesAvailable: 1 },
      // add more
    ];

    await Book.insertMany(sample);
    console.log('Seeded DB with sample books');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();