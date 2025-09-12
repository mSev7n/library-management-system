const mongoose = require("mongoose");

// Schema to track who borrowed which book
const borrowSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true
  },
  borrowerName: {
    type: String,
    required: true,
    trim: true
  },
  borrowerPhone: {
    type: String,
    required: true,
    trim: true
  },
  borrowedAt: {
    type: Date,
    default: Date.now
  },
  returnedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model("BorrowRecord", borrowSchema);