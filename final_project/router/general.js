const express = require('express');
const axios = require('axios');
let books = require('./booksdb.js');
let isValid = require('./auth_users.js').isValid;
let users = require('./auth_users.js').users;
const public_users = express.Router();

const BASE_URL = 'http://localhost:5000';

/* ---------- Promise-based data helpers (used by the server routes) ---------- */

const getBooks = () =>
  new Promise((resolve) => {
    resolve(books);
  });

const getBookByISBN = (isbn) =>
  new Promise((resolve, reject) => {
    if (books[isbn]) resolve(books[isbn]);
    else reject({ status: 404, message: 'Book with ISBN ' + isbn + ' not found' });
  });

const getBooksByField = (field, value) =>
  new Promise((resolve, reject) => {
    const matches = Object.keys(books)
      .filter((key) => books[key][field].toLowerCase() === value.toLowerCase())
      .map((key) => ({ isbn: key, ...books[key] }));
    if (matches.length > 0) resolve(matches);
    else reject({ status: 404, message: 'No books found for ' + field + ': ' + value });
  });

/* ---------- Routes ---------- */

// Register a new user
public_users.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  if (!isValid(username)) {
    return res.status(409).json({ message: 'User already exists!' });
  }

  users.push({ username, password });
  return res.status(200).json({ message: 'Customer successfully registered. Now you can login' });
});

// Get all books
public_users.get('/', async (req, res) => {
  try {
    const allBooks = await getBooks();
    return res.status(200).send(JSON.stringify(allBooks, null, 4));
  } catch (err) {
    return res.status(500).json({ message: 'Error retrieving books' });
  }
});

// Get book details by ISBN
public_users.get('/isbn/:isbn', async (req, res) => {
  try {
    const book = await getBookByISBN(req.params.isbn);
    return res.status(200).send(JSON.stringify(book, null, 4));
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

// Get book details by author
public_users.get('/author/:author', async (req, res) => {
  try {
    const result = await getBooksByField('author', req.params.author);
    return res.status(200).send(JSON.stringify({ booksbyauthor: result }, null, 4));
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

// Get book details by title
public_users.get('/title/:title', async (req, res) => {
  try {
    const result = await getBooksByField('title', req.params.title);
    return res.status(200).send(JSON.stringify({ booksbytitle: result }, null, 4));
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

// Get book reviews
public_users.get('/review/:isbn', async (req, res) => {
  try {
    const book = await getBookByISBN(req.params.isbn);
    return res.status(200).send(JSON.stringify(book.reviews, null, 4));
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

/* ---------- Axios client functions (Task 11) ----------
   These call the running server over HTTP using Axios with async/await
   and Promise callbacks. Start the server (npm start / node index.js),
   then run:  node router/general.js
*/

// Get all books - async/await
const getAllBooksAxios = async () => {
  try {
    const response = await axios.get(BASE_URL + '/');
    console.log('All books:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching all books:', error.message);
  }
};

// Get book by ISBN - Promise callbacks
const getBookByISBNAxios = (isbn) => {
  return axios
    .get(BASE_URL + '/isbn/' + isbn)
    .then((response) => {
      console.log('Book with ISBN ' + isbn + ':', response.data);
      return response.data;
    })
    .catch((error) => {
      console.error('Error fetching book by ISBN:', error.message);
    });
};

// Get books by author - async/await
const getBooksByAuthorAxios = async (author) => {
  try {
    const response = await axios.get(BASE_URL + '/author/' + encodeURIComponent(author));
    console.log('Books by ' + author + ':', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching books by author:', error.message);
  }
};

// Get books by title - Promise callbacks
const getBooksByTitleAxios = (title) => {
  return axios
    .get(BASE_URL + '/title/' + encodeURIComponent(title))
    .then((response) => {
      console.log('Books titled ' + title + ':', response.data);
      return response.data;
    })
    .catch((error) => {
      console.error('Error fetching books by title:', error.message);
    });
};

if (require.main === module) {
  (async () => {
    await getAllBooksAxios();
    await getBookByISBNAxios(1);
    await getBooksByAuthorAxios('Chinua Achebe');
    await getBooksByTitleAxios('Things Fall Apart');
  })();
}

module.exports.general = public_users;
module.exports.getAllBooksAxios = getAllBooksAxios;
module.exports.getBookByISBNAxios = getBookByISBNAxios;
module.exports.getBooksByAuthorAxios = getBooksByAuthorAxios;
module.exports.getBooksByTitleAxios = getBooksByTitleAxios;
