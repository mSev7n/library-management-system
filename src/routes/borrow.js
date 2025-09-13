const express = require("express");
const router = express.Router();
const { borrowBook, returnBook, getBorrowRecords } = require("../controllers/borrowController");

// Route for borrowing a specific book
router.post("/borrow/:id", borrowBook);

// Route for returning a specific book
router.post("/return/:id", returnBook);

// Route for viewing all borrow records
router.get("/", getBorrowRecords);

module.exports = router;
