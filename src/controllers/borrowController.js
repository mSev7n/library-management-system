const Book = require("../models/Book");

// Borrow a book
exports.borrowBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { borrowerName, borrowerPhone, copies } = req.body;

    if (!borrowerName || !borrowerPhone) {
      return res.status(400).json({ success: false, message: "Borrower's name and phone are required" });
    }

    // Ensure copies is a number
    copies = parseInt(copies);
    if (!copies || copies < 1) {
      return res.status(400).json({ success: false, message: "Number of copies to borrow is required" });
    }

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    if (book.copiesAvailable < copies) {
      return res.status(400).json({ success: false, message: `Only ${book.copiesAvailable} copies available` });
    }

    const existingBorrower = book.borrowers.find(
      b => b.name === borrowerName && b.phone === borrowerPhone
    );

    if (existingBorrower) {
      // Accumulate copies correctly
      existingBorrower.copies = (existingBorrower.copies || 0) + copies;
      existingBorrower.borrowedAt = new Date();
    } else {
      book.borrowers.push({
        name: borrowerName,
        phone: borrowerPhone,
        borrowedAt: new Date(),
        copies: copies
      });
    }

    book.copiesAvailable -= copies;

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
    let { borrowerName, borrowerPhone, count } = req.body; // count = number of copies to return

    // Ensure count is a number
    count = parseInt(count);
    if (!count || count < 1) {
      return res.status(400).json({ success: false, message: "Number of copies to return is required" });
    }

    // Find book
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    // Ensure there’s at least one borrower
    if (book.borrowers.length === 0) {
      return res.status(400).json({ success: false, message: "No active borrow to return" });
    }

    // Find the specific borrower by name + phone
    const borrower = book.borrowers.find(b => b.name === borrowerName && b.phone === borrowerPhone);
    if (!borrower) {
      return res.status(400).json({ success: false, message: "Borrower not found" });
    }

    const returnCount = Math.min(count, borrower.copies || 1);

    if ((borrower.copies || 1) <= returnCount) {
      // Remove borrower entirely if all copies returned
      book.borrowers = book.borrowers.filter(b => !(b.name === borrowerName && b.phone === borrowerPhone));
    } else {
      // Reduce the copies count for partial return
      borrower.copies -= returnCount;
    }

    // Increment available copies
    book.copiesAvailable += returnCount;

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
