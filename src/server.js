// src/server.js
// our entry point of the app. Configures Express, connects to DB, mounts routes and static frontend blah blah

require('dotenv').config();
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');

const connectDB = require('./config/db');
const bookRoutes = require('./routes/books');
const borrowRoutes = require('./routes/borrow');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json()); // parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // parse URL-encoded bodies
app.use(cors()); // enable CORS (configure for production)
app.use(morgan('dev')); // logging in dev

// API routes
app.use('/api/books', bookRoutes);
app.use('/api/borrow', borrowRoutes);

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Serve frontend static files (public folder)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Fallback to index.html for SPA (optional)
app.use((req, res) => {
  res.status(404).send('Not found');
});

// Error handler (last middleware)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV} on http://0.0.0.0:${PORT}`);
});
