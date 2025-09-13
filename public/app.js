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
    card.innerHTML = `
      <h3>${escapeHtml(book.title)}</h3>
      <div class="small">Author: ${escapeHtml(book.author)}</div>
      <div class="small">Genre: ${escapeHtml(book.genre || 'General')}</div>
      <div class="small">Year: ${book.year || '—'}</div>
      <div class="small">Copies available: <strong>${book.copiesAvailable}</strong></div>
      <div class="book-actions">
        <button data-id="${book._id}" class="updateBtn">Update</button>
        <button data-id="${book._id}" class="deleteBtn">Delete</button>
        <button data-id="${book._id}" class="borrowBtn">Borrow</button>
        <button data-id="${book._id}" class="returnBtn">Return</button>
      </div>
    `;

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
  const payload = {
    title: formData.get('title'),
    author: formData.get('author'),
    genre: formData.get('genre'),
    year: formData.get('year') ? Number(formData.get('year')) : undefined,
    copiesAvailable: formData.get('copiesAvailable') ? Number(formData.get('copiesAvailable')) : 1,
  };

  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
    const res = await fetch(`/api/borrow/borrow/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        borrowerName: prompt("Enter borrower's name:"),
        borrowerPhone: prompt("Enter borrower's phone number:")
      })
    });
    const data = await res.json();
    if (!data.success) {
      alert(data.message || 'Could not borrow');
      return;
    }
    fetchAndRenderBooks(currentQuery);
  } catch (err) {
    console.error(err);
    alert('Error borrowing book');
  }
}

// Return book
async function returnBook(id) {
  try {
    const res = await fetch(`/api/borrow/return/${id}`, { method: 'POST' });
    const data = await res.json();
    if (!data.success) {
      alert(data.message || 'Could not return');
      return;
    }
    fetchAndRenderBooks(currentQuery);
  } catch (err) {
    console.error(err);
    alert('Error returning book');
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
