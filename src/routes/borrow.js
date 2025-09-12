const express = require("express");
const router = express.Router();
const { borrowBook, returnBook, getBorrowRecords } = require("../controllers/borrowController");

// Route for borrowing a book
router.post("/borrow", borrowBook);

// Route for returning a book
router.post("/return", returnBook);

// Route for viewing all borrow records
router.get("/", getBorrowRecords);

module.exports = router;
