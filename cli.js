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
        "Borrow Record",
        "Delete a Book",
        "Switch to GUI",
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
    case "Borrow Record":
      await borrowRecordExplorer();
      break;
    case "Delete a Book":
      await deleteBook();
      break;
    case "Switch to GUI":
      console.log("🌐 Switching to GUI (Express server)...");
      require("./src/server"); // to start server so we can switch to GUI
      return;
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
    {
      name: "year",
      message: "Year published:",
      validate: (val) => !isNaN(val) || "Enter a number",
    },
    {
      name: "copiesAvailable",
      message: "Copies available:",
      default: 1,
      validate: (val) => !isNaN(val),
    },
  ]);

  const book = await Book.create({
    title: answers.title,
    author: answers.author,
    genre: answers.genre || "General",
    year: Number(answers.year),
    copiesAvailable: Number(answers.copiesAvailable),
  });
  console.log(`✅ Book added: ${book.title}`);
}

// List books
async function listBooks() {
  const books = await Book.find();
  if (!books.length) {
    console.log("⚠️ No books found");
    return;
  }
  console.log("\n📚 All Books:");
  books.forEach((b) => {
    console.log(`- ${b.title} (${b.year}) by ${b.author} | Copies: ${b.copiesAvailable}`);
  });
  console.log("");
}

// Search books
async function searchBooks() {
  const { q } = await inquirer.prompt([
    { name: "q", message: "Search term (title/author/genre):" },
  ]);
  const regex = new RegExp(q, "i");
  const books = await Book.find({
    $or: [{ title: regex }, { author: regex }, { genre: regex }],
  });
  if (!books.length) {
    console.log("⚠️ No matching books found");
    return;
  }
  console.log("\n🔍 Search results:");
  books.forEach((b) => {
    console.log(`- ${b.title} (${b.year}) by ${b.author} | Copies: ${b.copiesAvailable}`);
  });
  console.log("");
}

// Borrow book
async function borrowBook() {
  // Step 1: choose a book that has copies available
  const books = await Book.find({ copiesAvailable: { $gt: 0 } });
  if (!books.length) {
    console.log("⚠️ No books available to borrow");
    return;
  }

  // We'll manage the flow with loops so the user can go back at each step
  while (true) {
    const { bookId } = await inquirer.prompt([
      {
        type: "list",
        name: "bookId",
        message: "Choose a book to borrow:",
        choices: [
          ...books.map((b) => ({
            name: `${b.title} by ${b.author} (${b.copiesAvailable} copies)`,
            value: String(b._id),
          })),
          new inquirer.Separator(),
          { name: "↩ Back to Main Menu (Cancel)", value: "cancel-main" },
        ],
      },
    ]);

    if (bookId === "cancel-main") return; // back to main

    const book = await Book.findById(bookId);
    if (!book) {
      console.log("❌ Book not found, choose again");
      continue;
    }

    // Step 2: ask for borrower details step-by-step so 'back' / 'cancel' works as expected
    let borrowerName = null;
    let borrowerPhone = null;

    // borrower name
    while (true) {
      const { name } = await inquirer.prompt([
        {
          name: "name",
          message:
            "Borrower's name (type 'back' to choose another book or 'cancel' for main menu):",
        },
      ]);

      if (name === undefined) return; // treat as cancel
      const val = String(name).trim();
      if (!val) {
        console.log("Enter a name (or type 'back'/'cancel')");
        continue;
      }
      if (val.toLowerCase() === "back") {
        borrowerName = null;
        break; // go back to book selection
      }
      if (val.toLowerCase() === "cancel") return; // main menu

      borrowerName = val;
      break;
    }

    if (!borrowerName) continue; // user chose to go back to book selection

    // borrower phone
    while (true) {
      const { phone } = await inquirer.prompt([
        {
          name: "phone",
          message: "Borrower's phone number (or 'back'/'cancel'):",
        },
      ]);
      if (phone === undefined) return;
      const val = String(phone).trim();
      if (!val) {
        console.log("Enter a phone number (or type 'back'/'cancel')");
        continue;
      }
      if (val.toLowerCase() === "back") {
        // go back to name
        borrowerName = null;
        break;
      }
      if (val.toLowerCase() === "cancel") return;

      borrowerPhone = val;
      break;
    }

    if (!borrowerName) continue; // went back to name -> restart book selection

    // Step 3: ask how many copies to borrow (validate against book.copiesAvailable)
    let numCopies = null;
    while (true) {
      const { copiesToBorrow } = await inquirer.prompt([
        {
          name: "copiesToBorrow",
          message: `How many copies do you want to borrow? (available: ${book.copiesAvailable}) - type 'back' to change borrower or 'cancel' to abort`,
        },
      ]);

      if (copiesToBorrow === undefined) return;
      const raw = String(copiesToBorrow).trim();
      if (!raw) {
        console.log("Enter a number, or 'back'/'cancel'");
        continue;
      }
      if (raw.toLowerCase() === "back") {
        // go back to phone entry
        borrowerPhone = null;
        break;
      }
      if (raw.toLowerCase() === "cancel") return; // main menu

      const n = Number(raw);
      if (isNaN(n) || n < 1) {
        console.log("Enter a positive number, or 'back'/'cancel'");
        continue;
      }
      if (n > book.copiesAvailable) {
        console.log(`Only ${book.copiesAvailable} copies available`);
        continue;
      }
      numCopies = n;
      break;
    }

    if (numCopies === null) continue; // user went back to phone/name stage

    // Step 4: reuse existing BorrowRecord or create new one
    const existing = await BorrowRecord.findOne({
      book: bookId,
      borrowerName,
      borrowerPhone,
      returnedAt: null,
    });

    if (existing) {
      // increment copies (safely default to 0)
      existing.copies = (existing.copies || 0) + numCopies;
      existing.borrowedAt = new Date();
      await existing.save();
    } else {
      await BorrowRecord.create({
        book: bookId,
        borrowerName,
        borrowerPhone,
        copies: numCopies,
      });
    }

    // Step 5: decrement book copies
    book.copiesAvailable = Math.max(0, book.copiesAvailable - numCopies);
    await book.save();

    console.log(`✅ Borrowed ${numCopies} copy(ies) of "${book.title}" to ${borrowerName}`);
    return; // finished borrowing flow
  }
}

// Return book
async function returnBook() {
  // Step 1: find books which have active borrow records (returnedAt == null)
  const activeRecords = await BorrowRecord.find({ returnedAt: null }).populate("book");
  if (!activeRecords.length) {
    console.log("⚠️ No active borrow records");
    return;
  }

  // Aggregate active counts per book so we can display accurate info
  const bookStats = new Map();
  activeRecords.forEach((r) => {
    if (!r.book) return;
    const id = String(r.book._id);
    const stat = bookStats.get(id) || { book: r.book, activeRecords: 0, activeCopies: 0 };
    stat.activeRecords += 1;
    stat.activeCopies += (r.copies || 1);
    bookStats.set(id, stat);
  });

  const books = Array.from(bookStats.values()).map((s) => s.book);
  if (!books.length) {
    console.log("⚠️ No borrowed books found");
    return;
  }

  const { bookId } = await inquirer.prompt([
    {
      type: "list",
      name: "bookId",
      message: "Choose a book to return from (or Cancel):",
      choices: [
        ...Array.from(bookStats.entries()).map(([id, stat]) => ({
          name: `${stat.book.title} (${stat.book.year}) by ${stat.book.author} — ${stat.activeCopies} active copy(ies) across ${stat.activeRecords} borrow(s)`,
          value: id,
        })),
        new inquirer.Separator(),
        { name: "↩ Back to Main Menu (Cancel)", value: "cancel-main" },
      ],
    },
  ]);

  if (bookId === "cancel-main") return;

  // Step 2: show borrowers for that book (active), grouped by borrower name+phone
  let borrowers = await BorrowRecord.find({ book: bookId, returnedAt: null }).sort({ borrowedAt: -1 });
  if (!borrowers.length) {
    console.log("⚠️ No active borrowers for this book");
    return;
  }

  // Group borrowers by name-phone with representative record id
  function buildBorrowerGroups(list) {
    const map = new Map();
    list.forEach((r) => {
      const key = `${r.borrowerName || "<unknown>"}||${r.borrowerPhone || ""}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          borrowerName: r.borrowerName || "<unknown>",
          borrowerPhone: r.borrowerPhone || "",
          totalCopies: r.copies || 1,
          repId: String(r._id),
        });
      } else {
        existing.totalCopies += (r.copies || 1);
      }
    });
    return Array.from(map.values());
  }

  // Helper - show borrower selection with search option
  async function selectBorrowerInteractive(groups) {
    const choices = groups.map((g, idx) => ({
      name: `${idx + 1}. ${g.borrowerName} (${g.borrowerPhone || "no phone"}) — ${g.totalCopies} active copy(ies)`,
      value: g.repId,
    }));
    choices.push(new inquirer.Separator());
    choices.push({ name: "🔎 Search borrower by name/phone", value: "search" });
    choices.push({ name: "↩ Back to Book Selection", value: "back-book" });
    choices.push({ name: "↩ Back to Main Menu (Cancel)", value: "cancel-main" });

    const { chosen } = await inquirer.prompt([
      {
        type: "list",
        name: "chosen",
        message: "Select borrower (or search/cancel):",
        choices,
        pageSize: 12,
      },
    ]);
    return chosen;
  }

  while (true) {
    // refresh active borrower records
    borrowers = await BorrowRecord.find({ book: bookId, returnedAt: null }).sort({ borrowedAt: -1 });
    if (!borrowers.length) {
      console.log("⚠️ No active borrowers left for this book");
      return;
    }

    const groups = buildBorrowerGroups(borrowers);
    const chosen = await selectBorrowerInteractive(groups);

    if (chosen === "back-book") {
      // go back to book selection
      return returnBook();
    }
    if (chosen === "cancel-main") {
      return;
    }
    if (chosen === "search") {
      const { q } = await inquirer.prompt([{ name: "q", message: "Search borrower name/phone (or type 'back'/'cancel'):" }]);
      if (!q) continue;
      if (q.toLowerCase() === "back") continue; // re-loop choose
      if (q.toLowerCase() === "cancel") return;
      const reg = new RegExp(q, "i");
      const filteredGroups = groups.filter((g) => reg.test(g.borrowerName) || reg.test(g.borrowerPhone || ""));
      if (!filteredGroups.length) {
        console.log("⚠️ No matching borrowers found");
        continue;
      }
      const { sel } = await inquirer.prompt([
        {
          type: "list",
          name: "sel",
          message: "Select borrower from search results (or Back):",
          choices: [
            ...filteredGroups.map((g, idx) => ({ name: `${g.borrowerName} (${g.borrowerPhone || "no phone"}) — ${g.totalCopies} active copy(ies)`, value: g.repId })),
            new inquirer.Separator(),
            { name: "↩ Back to Borrower List", value: "back" },
            { name: "↩ Back to Main Menu (Cancel)", value: "cancel-main" },
          ],
        },
      ]);
      if (sel === "back") continue;
      if (sel === "cancel-main") return;
      // user selected a representative record id -> proceed to process return for this borrower
      await processReturnForBorrower(bookId, sel);
      return;
    }

    // If chosen is a representative record id, process return
    await processReturnForBorrower(bookId, chosen);
    return;
  }
}

// Helper: process return for a borrower on a given book (handles multiple borrow records)
async function processReturnForBorrower(bookId, recordId) {
  // Fetch the primary record to know borrower identity
  const primary = await BorrowRecord.findById(recordId);
  if (!primary) {
    console.log("❌ Borrow record not found");
    return;
  }
  const borrowerName = primary.borrowerName || "<unknown>";
  const borrowerPhone = primary.borrowerPhone || "";

  // Get all active records for this borrower/book sorted newest-first
  let records = await BorrowRecord.find({
    book: bookId,
    borrowerName,
    borrowerPhone,
    returnedAt: null,
  }).sort({ borrowedAt: -1 });

  if (!records.length) {
    console.log("⚠️ No active records for this borrower on this book");
    return;
  }

  // Calculate total active copies
  let totalCopies = records.reduce((s, r) => s + (r.copies || 1), 0);

  console.log(`\n${borrowerName} (${borrowerPhone || "no phone"}) currently has ${totalCopies} active copy(ies) for this book.`);
  records.forEach((r, idx) => {
    console.log(`${idx + 1}. Borrowed on ${r.borrowedAt ? r.borrowedAt.toDateString() : "unknown"} — ${r.copies || 1} copy(ies) (record id: ${r._id})`);
  });

  const { returnCountInput } = await inquirer.prompt([
    {
      name: "returnCountInput",
      message: `How many copies to return (max ${totalCopies})? Type 'back' to cancel and go back, 'cancel' for main menu:`,
      validate: (val) => {
        if (!val) return "Enter a number, 'back' or 'cancel'";
        if (String(val).toLowerCase() === "back" || String(val).toLowerCase() === "cancel") return true;
        const n = Number(val);
        if (isNaN(n) || n < 1) return "Enter a positive number";
        if (n > totalCopies) return `You can return at most ${totalCopies}`;
        return true;
      },
    },
  ]);

  if (!returnCountInput) return;

  if (String(returnCountInput).toLowerCase() === "back") {
    return; // back to borrower selection
  }
  if (String(returnCountInput).toLowerCase() === "cancel") {
    return; // main menu
  }

  let toReturn = Number(returnCountInput);

  // Process return across records newest-first
  for (let rec of records) {
    if (toReturn <= 0) break;
    const recCopies = rec.copies || 1;
    const reduce = Math.min(recCopies, toReturn);
    rec.copies = recCopies - reduce;
    toReturn -= reduce;
    if (rec.copies <= 0) {
      rec.returnedAt = new Date();
      rec.copies = 0;
    }
    await rec.save();
  }

  // Increase book copiesAvailable by initial return count
  const returnedCount = Number(returnCountInput);
  await Book.findByIdAndUpdate(bookId, { $inc: { copiesAvailable: returnedCount } });

  console.log(`✅ Returned ${returnedCount} copy(ies) from ${borrowerName}`);
}

// Borrow Record Explorer
async function borrowRecordExplorer() {
  // List all books that have any borrow records (historical)
  const records = await BorrowRecord.find().populate("book");
  if (!records.length) {
    console.log("⚠️ No borrow records in the system");
    return;
  }

  // Group records by book
  const booksMap = new Map();
  records.forEach((r) => {
    if (!r.book) return;
    const key = String(r.book._id);
    if (!booksMap.has(key)) booksMap.set(key, r.book);
  });

  const books = Array.from(booksMap.values());

  const { bookId } = await inquirer.prompt([
    {
      type: "list",
      name: "bookId",
      message: "Choose a book to view its borrowers (or Cancel):",
      choices: [
        ...books.map((b) => ({ name: `${b.title} by ${b.author}`, value: b._id })),
        new inquirer.Separator(),
        { name: "↩ Back to Main Menu (Cancel)", value: "cancel-main" },
      ],
    },
  ]);
  if (bookId === "cancel-main") return;

  // Get all records for that book (including returned ones), group by borrower
  const bookRecords = await BorrowRecord.find({ book: bookId }).sort({ borrowedAt: -1 }).populate("book");
  if (!bookRecords.length) {
    console.log("⚠️ No borrow records for this book");
    return;
  }

  const borrowerMap = new Map(); // key = name-phone
  bookRecords.forEach((r) => {
    const key = `${r.borrowerName}-${r.borrowerPhone}`;
    const existing = borrowerMap.get(key) || { name: r.borrowerName, phone: r.borrowerPhone, total: 0, records: [] };
    existing.records.push(r);
    existing.total += (r.copies || 1);
    borrowerMap.set(key, existing);
  });

  const borrowers = Array.from(borrowerMap.values());

  // Provide search option and list selection
  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: "Choose a borrower from the list or Search by name:",
      choices: [
        ...borrowers.map((b, idx) => ({ name: `${idx + 1}. ${b.name} (${b.phone}) — total ${b.total} copies`, value: idx })),
        new inquirer.Separator(),
        { name: "🔎 Search borrower by name", value: "search" },
        { name: "↩ Back to Main Menu (Cancel)", value: "cancel-main" },
      ],
      pageSize: 12,
    },
  ]);

  if (choice === "cancel-main") return;

  let selectedBorrower;
  if (choice === "search") {
    const { q } = await inquirer.prompt([{ name: "q", message: "Type name or phone to search (or 'cancel'):" }]);
    if (!q) return;
    if (q.toLowerCase() === "cancel") return;
    const reg = new RegExp(q, "i");
    const matches = borrowers.filter((b) => reg.test(b.name) || reg.test(String(b.phone || "")));
    if (!matches.length) {
      console.log("⚠️ No matching borrowers found");
      return;
    }
    const { sel } = await inquirer.prompt([
      {
        type: "list",
        name: "sel",
        message: "Select person from search results (or Cancel):",
        choices: [
          ...matches.map((m, idx) => ({ name: `${m.name} (${m.phone}) — total ${m.total}`, value: m })),
          new inquirer.Separator(),
          { name: "↩ Back", value: "back" },
        ],
      },
    ]);
    if (sel === "back") return;
    selectedBorrower = sel;
  } else {
    selectedBorrower = borrowers[choice];
  }

  // Show detailed borrow records for the selected person
  console.log(`\n📖 Borrow records for ${selectedBorrower.name} (${selectedBorrower.phone}):`);
  selectedBorrower.records.forEach((r) => {
    console.log(`- ${r.book && r.book.title ? r.book.title : "(book deleted)"} | Borrowed on: ${r.borrowedAt ? r.borrowedAt.toDateString() : "unknown"} | Copies: ${r.copies || 1} | Returned: ${r.returnedAt ? r.returnedAt.toDateString() : "No"}`);
  });
  console.log("");
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
      choices: books.map((b) => ({
        name: `${b.title} by ${b.author}`,
        value: b._id,
      })),
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
