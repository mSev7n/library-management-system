// cli.js
// A simple terminal-based Library Management System using Node.js and MongoDB.
// It reuses our existing Book and BorrowRecord models for CRUD operations.

require("dotenv").config();
const mongoose = require("mongoose");
const inquirer = require("inquirer").default;

// Import models
const Book = require("./src/models/Book");
const BorrowRecord = require("./src/models/BorrowRecord");

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

// Menu
async function mainMenu() {
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "📚 Library Management CLI - Choose an action:",
      choices: [
        "Add a Book",
        "List All Books",
        "Search Books",
        "Borrow a Book",
        "Return a Book",
        "Delete a Book",
        "Exit",
      ],
    },
  ]);

  switch (action) {
    case "Add a Book":
      await addBook();
      break;
    case "List All Books":
      await listBooks();
      break;
    case "Search Books":
      await searchBooks();
      break;
    case "Borrow a Book":
      await borrowBook();
      break;
    case "Return a Book":
      await returnBook();
      break;
    case "Delete a Book":
      await deleteBook();
      break;
    case "Exit":
      console.log("👋 Goodbye!");
      mongoose.disconnect();
      return;
  }

  // Loop back
  await mainMenu();
}

// === Operations ===

// Add book
async function addBook() {
  const answers = await inquirer.prompt([
    { name: "title", message: "Book title:" },
    { name: "author", message: "Author:" },
    { name: "genre", message: "Genre (optional):" },
    { name: "year", message: "Year published:", validate: val => !isNaN(val) || "Enter a number" },
    { name: "copiesAvailable", message: "Copies available:", default: 1, validate: val => !isNaN(val) },
  ]);

  const book = await Book.create({
    title: answers.title,
    author: answers.author,
    genre: answers.genre || "General",
    year: Number(answers.year),
    copiesAvailable: Number(answers.copiesAvailable),
  });

  console.log("✅ Book added:", book.title);
}

// List books
async function listBooks() {
  const books = await Book.find();
  if (!books.length) {
    console.log("⚠️ No books found");
    return;
  }
  console.log("\n📚 All Books:");
  books.forEach(b => {
    console.log(`- ${b.title} (${b.year}) by ${b.author} | Copies: ${b.copiesAvailable}`);
  });
  console.log("");
}

// Search books
async function searchBooks() {
  const { q } = await inquirer.prompt([{ name: "q", message: "Search term (title/author/genre):" }]);
  const regex = new RegExp(q, "i");
  const books = await Book.find({
    $or: [{ title: regex }, { author: regex }, { genre: regex }],
  });

  if (!books.length) {
    console.log("⚠️ No matching books found");
    return;
  }
  console.log("\n🔍 Search results:");
  books.forEach(b => {
    console.log(`- ${b.title} (${b.year}) by ${b.author} | Copies: ${b.copiesAvailable}`);
  });
  console.log("");
}

// Borrow book
async function borrowBook() {
  const books = await Book.find({ copiesAvailable: { $gt: 0 } });
  if (!books.length) {
    console.log("⚠️ No books available to borrow");
    return;
  }

  const { bookId } = await inquirer.prompt([
    {
      type: "list",
      name: "bookId",
      message: "Choose a book to borrow:",
      choices: books.map(b => ({ name: `${b.title} by ${b.author} (${b.copiesAvailable} copies)`, value: b._id })),
    },
  ]);

  const { borrowerName, borrowerPhone } = await inquirer.prompt([
    { name: "borrowerName", message: "Borrower's name:" },
    { name: "borrowerPhone", message: "Borrower's phone number:" },
  ]);

  // Update copies and create borrow record
  const book = await Book.findOneAndUpdate(
    { _id: bookId, copiesAvailable: { $gt: 0 } },
    { $inc: { copiesAvailable: -1 } },
    { new: true }
  );

  if (!book) {
    console.log("❌ Book not available");
    return;
  }

  await BorrowRecord.create({ book: bookId, borrowerName, borrowerPhone });
  console.log(`✅ Borrowed "${book.title}" to ${borrowerName}`);
}

// Return book
async function returnBook() {
  const records = await BorrowRecord.find({ returnedAt: null }).populate("book");
  if (!records.length) {
    console.log("⚠️ No active borrow records");
    return;
  }

  const { recordId } = await inquirer.prompt([
    {
      type: "list",
      name: "recordId",
      message: "Choose a record to return:",
      choices: records.map(r => ({
        name: `${r.book.title} borrowed by ${r.borrowerName} (${r.borrowerPhone})`,
        value: r._id,
      })),
    },
  ]);

  const record = await BorrowRecord.findById(recordId).populate("book");
  record.returnedAt = new Date();
  await record.save();

  await Book.findByIdAndUpdate(record.book._id, { $inc: { copiesAvailable: 1 } });

  console.log(`✅ Returned "${record.book.title}" from ${record.borrowerName}`);
}

// Delete book
async function deleteBook() {
  const books = await Book.find();
  if (!books.length) {
    console.log("⚠️ No books to delete");
    return;
  }

  const { bookId } = await inquirer.prompt([
    {
      type: "list",
      name: "bookId",
      message: "Choose a book to delete:",
      choices: books.map(b => ({ name: `${b.title} by ${b.author}`, value: b._id })),
    },
  ]);

  await Book.findByIdAndDelete(bookId);
  console.log("✅ Book deleted");
}

// Run CLI
(async () => {
  await connectDB();
  await mainMenu();
})();
