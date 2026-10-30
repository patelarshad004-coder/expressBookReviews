const express = require('express');
const jwt = require('jsonwebtoken');
let books = require('./booksdb.js');
const regd_users = express.Router();

let users = [];

// True if the username is not taken yet (valid for registration)
const isValid = (username) => {
  return !users.some((user) => user.username === username);
};

// True if username and password match a registered user
const authenticatedUser = (username, password) => {
  return users.some((user) => user.username === username && user.password === password);
};

// Login as a registered user
regd_users.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: 'Invalid login. Check username and password' });
  }

  const accessToken = jwt.sign({ data: password, username }, 'access', { expiresIn: 60 * 60 });
  req.session.authorization = { accessToken, username };

  return res.status(200).json({ message: 'Customer successfully logged in' });
});

// Add or modify a book review (review text via query string ?review=... or JSON body)
regd_users.put('/auth/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review || (req.body && req.body.review);
  const username = req.session.authorization.username;

  if (!books[isbn]) {
    return res.status(404).json({ message: 'Book with ISBN ' + isbn + ' not found' });
  }
  if (!review) {
    return res.status(400).json({ message: 'Review text is required' });
  }

  const isUpdate = books[isbn].reviews[username] !== undefined;
  books[isbn].reviews[username] = review;

  return res.status(200).json({
    message: 'Review for the book with ISBN ' + isbn + (isUpdate ? ' has been updated.' : ' has been added.'),
    reviews: books[isbn].reviews,
  });
});

// Delete the logged-in user's review of a book
regd_users.delete('/auth/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;

  if (!books[isbn]) {
    return res.status(404).json({ message: 'Book with ISBN ' + isbn + ' not found' });
  }
  if (books[isbn].reviews[username] === undefined) {
    return res.status(404).json({ message: 'No review by ' + username + ' for ISBN ' + isbn });
  }

  delete books[isbn].reviews[username];

  return res.status(200).json({
    message: 'Review for the book with ISBN ' + isbn + ' posted by ' + username + ' has been deleted.',
    reviews: books[isbn].reviews,
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
