// public/app.js
// our client-side JavaScript for interacting with backend API and updating DOM.

// base API path
const API_BASE = '/api/books';

const addBookForm = document.getElementById('addBookForm');
const booksList = document.getElementById('booksList');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resetBtn = document.getElementById('resetBtn');
const filterGenre = document.getElementById('filterGenre');
const statsDiv = document.getElementById('stats');

let currentQuery = {};

// Fetch and render books when page loads
document.addEventListener('DOMContentLoaded', () => {
  fetchAndRenderBooks();
});

// Helper: fetch books with optional query
async function fetchBooks(query = {}) {
  const params = new URLSearchParams(query);
  const res = await fetch(`${API_BASE}?${params.toString()}`);
  return res.json();
}

// Render list of books into the page
async function fetchAndRenderBooks(q = {}) {
  const data = await fetchBooks(q);
  if (!data.success) {
    booksList.innerHTML = '<p>Could not fetch books</p>';
    return;
  }

  // populate genre filter
  const genres = new Set(data.data.map(b => b.genre || 'General'));
  // preserve current selection
  const selected = filterGenre.value || '';
  filterGenre.innerHTML = `<option value="">All genres</option>`;
  genres.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g;
    opt.textContent = g;
    if (g === selected) opt.selected = true;
    filterGenre.appendChild(opt);
  });

  // stats
  const totalBooks = data.total;
  const totalCopies = data.data.reduce((s, b) => s + (b.copiesAvailable || 0), 0);
  statsDiv.innerHTML = `<div class="stats">
    <strong>Total books:</strong> ${totalBooks} &nbsp; | &nbsp;
    <strong>Total copies available:</strong> ${totalCopies}
  </div>`;

  // render cards
  booksList.innerHTML = '';
  data.data.forEach(book => {
    const card = document.createElement('div');
    card.className = 'book-card';

    // Book cover
    const coverDiv = document.createElement('div');
    coverDiv.className = 'book-cover';
    if (book.coverImage && book.coverImage.trim() !== '') {
      coverDiv.style.backgroundImage = `url('${book.coverImage}')`;
      coverDiv.style.backgroundColor = 'transparent';
    } else {
      coverDiv.style.backgroundImage = 'none';
      coverDiv.style.backgroundColor = book.coverColor || '#3498db';
    }

    // Book info
    const infoDiv = document.createElement('div');
    infoDiv.className = 'book-info';
    infoDiv.innerHTML = `
      <h3>${escapeHtml(book.title)}</h3>
      <div class="small">Author: ${escapeHtml(book.author)}</div>
      <div class="small">Genre: ${escapeHtml(book.genre || 'General')}</div>
      <div class="small">Year: ${book.year || '—'}</div>
      <div class="small">Copies available: <strong>${book.copiesAvailable}</strong></div>
    `;

    // Actions
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'book-actions';
    actionsDiv.innerHTML = `
      <button data-id="${book._id}" class="updateBtn">Update</button>
      <button data-id="${book._id}" class="deleteBtn">Delete</button>
      <button data-id="${book._id}" class="borrowBtn">Borrow</button>
      <button data-id="${book._id}" class="returnBtn">Return</button>
    `;

    card.appendChild(coverDiv);
    card.appendChild(infoDiv);
    card.appendChild(actionsDiv);

    booksList.appendChild(card);
  });
}

// Escape to avoid injection (small helper)
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function (m) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
  });
}

// Add book form submit
addBookForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(addBookForm);

  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      body: formData, // sending as multipart/form-data
    });
    const data = await res.json();
    if (!data.success) {
      alert('Error creating book: ' + (data.message || JSON.stringify(data)));
      return;
    }
    // reset form and refresh books
    addBookForm.reset();
    fetchAndRenderBooks(currentQuery);
  } catch (err) {
    console.error(err);
    alert('Error creating book');
  }
});

// Delegate clicks on update/delete/borrow/return
booksList.addEventListener('click', async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains('deleteBtn')) {
    if (!confirm('Delete this book?')) return;
    await deleteBook(id);
    return;
  }

  if (e.target.classList.contains('updateBtn')) {
    await promptAndUpdateBook(id);
    return;
  }

  if (e.target.classList.contains('borrowBtn')) {
    await borrowBook(id);
    return;
  }

  if (e.target.classList.contains('returnBtn')) {
    await returnBook(id);
    return;
  }
});

// Delete book
async function deleteBook(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) {
      alert('Delete failed');
      return;
    }
    fetchAndRenderBooks(currentQuery);
  } catch (err) {
    console.error(err);
    alert('Error deleting book');
  }
}

// Prompt for new data and send update
async function promptAndUpdateBook(id) {
  // fetch current book
  const res = await fetch(`${API_BASE}/${id}`);
  const { data } = await res.json();
  if (!data) {
    alert('Book not found');
    return;
  }

  const newTitle = prompt('Title', data.title) || data.title;
  const newAuthor = prompt('Author', data.author) || data.author;
  const newGenre = prompt('Genre', data.genre || '') || data.genre;
  const newYear = prompt('Year', data.year || '') || data.year;
  const newCopies = prompt('Copies available', data.copiesAvailable) || data.copiesAvailable;

  const payload = {
    title: newTitle,
    author: newAuthor,
    genre: newGenre,
    year: newYear ? Number(newYear) : undefined,
    copiesAvailable: newCopies ? Number(newCopies) : undefined,
  };

  try {
    const r = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const resData = await r.json();
    if (!resData.success) {
      alert('Update failed: ' + JSON.stringify(resData));
      return;
    }
    fetchAndRenderBooks(currentQuery);
  } catch (err) {
    console.error(err);
    alert('Error updating book');
  }
}

// Borrow book
async function borrowBook(id) {
  try {
    // First, check if the book is available
    const availabilityRes = await fetch(`/api/books/${id}`);
    const bookData = await availabilityRes.json();

    if (!bookData.success) {
      alert(bookData.message || "Error fetching book");
      return;
    }

    if (bookData.data.copiesAvailable < 1) {
      alert("No copies available");
      return;
    }

    // Prompt for borrower's name
    const borrowerName = prompt("Enter borrower's name:");
    if (borrowerName === null) return; // user clicked Cancel

    // Prompt for borrower's phone
    const borrowerPhone = prompt("Enter borrower's phone number:");
    if (borrowerPhone === null) return; // user clicked Cancel

    if (!borrowerName.trim() || !borrowerPhone.trim()) {
      alert("Borrower's name and phone are required");
      return;
    }

    // Prompt for number of copies
    const maxCopies = bookData.data.copiesAvailable;
    let copies;
    while (true) {
      const copiesStr = prompt(`How many copies to borrow? (1 - ${maxCopies})`);
      if (copiesStr === null) return; // cancel
      copies = parseInt(copiesStr);
      if (!isNaN(copies) && copies >= 1 && copies <= maxCopies) break;
      alert(`Invalid number of copies. Must be between 1 and ${maxCopies}`);
    }

    // Send borrow request to backend
    const res = await fetch(`/api/borrow/borrow/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borrowerName, borrowerPhone, copies }), // send copies as number
    });

    const data = await res.json();
    if (!data.success) {
      alert(data.message || "Could not borrow");
      return;
    }

    alert("Borrowed successfully!");
    fetchAndRenderBooks(currentQuery); // refresh list
  } catch (err) {
    console.error(err);
    alert("Error borrowing book");
  }
}

// Return book
async function returnBook(id) {
  try {
    // Fetch book data including borrowers
    const resBook = await fetch(`/api/books/${id}`);
    const bookData = await resBook.json();

    if (!bookData.success) {
      alert(bookData.message || "Error fetching book");
      return;
    }

    const borrowers = bookData.data.borrowers;
    if (borrowers.length === 0) {
      alert("No active borrow to return");
      return;
    }

    // Display list of borrowers
    let listStr = "Borrowers:\n";
    borrowers.forEach((b, index) => {
      listStr += `${index + 1}. ${b.name} - ${b.phone} (Borrowed: ${b.copies || 1})\n`;
    });
    listStr += "\nEnter the number of the borrower to return, or type a name to search:";

    let selection = prompt(listStr);
    if (selection === null) return; // user clicked Cancel

    let borrower;
    let borrowerIndex;

    if (!isNaN(selection)) {
      borrowerIndex = parseInt(selection) - 1;
      borrower = borrowers[borrowerIndex];
      if (!borrower) {
        alert("Invalid selection");
        return;
      }
    } else {
      const matched = borrowers
        .map((b, index) => ({ ...b, index }))
        .filter(b => b.name.toLowerCase().includes(selection.toLowerCase()));

      if (matched.length === 0) {
        alert("No borrower found with that name");
        return;
      } else if (matched.length === 1) {
        borrower = matched[0];
        borrowerIndex = matched[0].index;
      } else {
        let matchList = "Multiple borrowers found:\n";
        matched.forEach((b, i) => {
          matchList += `${i + 1}. ${b.name} - ${b.phone} (Borrowed: ${b.copies || 1})\n`;
        });
        matchList += "\nEnter the number of the borrower to return:";
        const subSelection = prompt(matchList);
        if (subSelection === null) return; // cancel
        const subIndex = parseInt(subSelection) - 1;
        if (isNaN(subIndex) || subIndex < 0 || subIndex >= matched.length) {
          alert("Invalid selection");
          return;
        }
        borrower = matched[subIndex];
        borrowerIndex = borrower.index;
      }
    }

    // Determine how many copies to return
    const borrowedCopies = borrower.copies || 1;
    let returnCount = borrowedCopies;
    if (borrowedCopies > 1) {
      while (true) {
        let input = prompt(`This borrower has ${borrowedCopies} copies. How many do you want to return? Type "all" for all:`);
        if (input === null) return; // cancel
        if (input.toLowerCase() === "all") {
          returnCount = borrowedCopies;
          break;
        }
        const n = parseInt(input);
        if (!isNaN(n) && n > 0 && n <= borrowedCopies) {
          returnCount = n;
          break;
        }
        alert(`Invalid number. Must be between 1 and ${borrowedCopies}`);
      }
    }

    // Call backend to return selected borrower using name + phone
    const res = await fetch(`/api/borrow/return/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borrowerName: borrower.name, borrowerPhone: borrower.phone, count: returnCount })
    });

    const data = await res.json();
    if (!data.success) {
      alert(data.message || "Could not return");
      return;
    }

    alert("Returned successfully!");
    fetchAndRenderBooks(currentQuery);
  } catch (err) {
    console.error(err);
    alert("Error returning book");
  }
}

// Search & filter
searchBtn.addEventListener('click', () => {
  const q = searchInput.value.trim();
  const genre = filterGenre.value;
  currentQuery = {};
  if (q) currentQuery.q = q;
  if (genre) currentQuery.genre = genre;
  fetchAndRenderBooks(currentQuery);
});

resetBtn.addEventListener('click', () => {
  searchInput.value = '';
  filterGenre.value = '';
  currentQuery = {};
  fetchAndRenderBooks();
});
