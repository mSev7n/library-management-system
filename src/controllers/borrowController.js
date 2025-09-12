const Book = require("../models/Book");
const BorrowRecord = require("../models/BorrowRecord");

// Borrow a book
exports.borrowBook = async (req, res, next) => {
  try {
    const { bookId, borrowerName, borrowerPhone } = req.body;

    // Atomically decrement copiesAvailable if > 0
    const book = await Book.findOneAndUpdate(
      { _id: bookId, copiesAvailable: { $gt: 0 } },
      { $inc: { copiesAvailable: -1 } },
      { new: true }
    );
    if (!book) return res.status(400).json({ message: "Book not available" });

    // Create borrow record
    const borrowRecord = await BorrowRecord.create({
      book: bookId,
      borrowerName,
      borrowerPhone
    });

    res.status(201).json({ message: "Book borrowed successfully", borrowRecord });
  } catch (error) {
    next(error);
  }
};

// Return a book
exports.returnBook = async (req, res, next) => {
  try {
    const { recordId } = req.body;

    // Find borrow record
    const record = await BorrowRecord.findById(recordId).populate("book");
    if (!record) return res.status(404).json({ message: "Borrow record not found" });

    if (record.returnedAt) return res.status(400).json({ message: "Book already returned" });

    // Mark return
    record.returnedAt = new Date();
    await record.save();

    // Atomically increment book copies
    await Book.findByIdAndUpdate(record.book._id, { $inc: { copiesAvailable: 1 } });

    res.json({ message: "Book returned successfully", record });
  } catch (error) {
    next(error);
  }
};

// Get all borrow records
exports.getBorrowRecords = async (req, res, next) => {
  try {
    const records = await BorrowRecord.find().populate("book");
    res.json(records);
  } catch (error) {
    next(error);
  }
};