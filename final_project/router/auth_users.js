const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
  const usersWithSameName = users.filter((user) => user.username === username);
  return usersWithSameName.length > 0;
};

const authenticatedUser = (username, password) => {
  const matchingUsers = users.filter(
    (user) => user.username === username && user.password === password
  );
  return matchingUsers.length > 0;
};

regd_users.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({ message: 'Error logging in' });
  }

  if (authenticatedUser(username, password)) {
    const accessToken = jwt.sign({ data: password }, 'access', {
      expiresIn: 60 * 60,
    });
    req.session.authorization = { accessToken, username };
    return res.status(200).send('User successfully logged in');
  }

  return res
    .status(208)
    .json({ message: 'Invalid Login. Check username and password' });
});

regd_users.put('/auth/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session?.authorization?.username;

  if (!username) {
    return res.status(401).json({ message: 'User not logged in' });
  }

  if (!review) {
    return res.status(400).json({ message: 'Review content is required' });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: 'Book not found' });
  }

  if (!books[isbn].reviews) {
    books[isbn].reviews = {};
  }

  books[isbn].reviews[username] = review;
  return res.status(200).json({
    message: 'Review added/modified successfully',
    reviews: books[isbn].reviews,
  });
});

regd_users.delete('/auth/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session?.authorization?.username;

  if (!username) {
    return res.status(401).json({ message: 'User not logged in' });
  }

  if (
    books[isbn] &&
    books[isbn].reviews &&
    books[isbn].reviews[username]
  ) {
    delete books[isbn].reviews[username];
    return res.status(200).json({
      message: 'Review deleted successfully',
      reviews: books[isbn].reviews,
    });
  }

  return res
    .status(404)
    .json({ message: 'Review not found or book does not exist' });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
