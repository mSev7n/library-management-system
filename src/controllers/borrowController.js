const Book = require("../models/Book");

// Borrow a book
exports.borrowBook = async (req, res, next) => {
  try {
    const { id } = req.params; // book id comes from URL
    const { borrowerName, borrowerPhone } = req.body;

    // Validate input
    if (!borrowerName || !borrowerPhone) {
      return res.status(400).json({ success: false, message: "Borrower's name and phone are required" });
    }

    // Find book
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    // Check availability
    if (book.copiesAvailable < 1) {
      return res.status(400).json({ success: false, message: "Book not available" });
    }

    // Decrement available copies
    book.copiesAvailable -= 1;

    // Add borrower info into borrowers array
    book.borrowers.push({
      name: borrowerName,
      phone: borrowerPhone,
      borrowedAt: new Date(),
    });

    await book.save();

    res.status(201).json({ success: true, message: "Book borrowed successfully", data: book });
  } catch (error) {
    next(error);
  }
};

// Return a book
exports.returnBook = async (req, res, next) => {
  try {
    const { id } = req.params; // book id comes from URL

    // Find book
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    // Ensure there’s at least one borrower
    if (book.borrowers.length === 0) {
      return res.status(400).json({ success: false, message: "No active borrow to return" });
    }

    // Remove the last borrower (simple strict system: one return == one borrow undone)
    book.borrowers.pop();

    // Increment available copies
    book.copiesAvailable += 1;

    await book.save();

    res.json({ success: true, message: "Book returned successfully", data: book });
  } catch (error) {
    next(error);
  }
};

// Get all borrow records (from borrowers array inside books)
exports.getBorrowRecords = async (req, res, next) => {
  try {
    // Fetch all books and their borrowers
    const books = await Book.find().select("title author borrowers copiesAvailable");
    res.json({ success: true, data: books });
  } catch (error) {
    next(error);
  }
};
