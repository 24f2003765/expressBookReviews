const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

public_users.post('/register', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username && password) {
    if (!isValid(username)) {
      users.push({ username, password });
      return res.status(200).json({
        message: 'User successfully registred. Now you can login',
      });
    }
    return res.status(404).json({ message: 'User already exists!' });
  }

  return res
    .status(404)
    .json({ message: 'Unable to register user. Username and/or password not provided' });
});

const axiosBooksAdapter = (data) => ({
  url: 'internal://books',
  adapter: () =>
    Promise.resolve({
      data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    }),
});

public_users.get('/', async (req, res) => {
  try {
    const response = await axios(axiosBooksAdapter(books));
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving books' });
  }
});

public_users.get('/isbn/:isbn', async (req, res) => {
  const isbn = req.params.isbn;
  try {
    const book = books[isbn];
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    const response = await axios(axiosBooksAdapter(book));
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(404).json({ message: 'Book not found' });
  }
});

public_users.get('/author/:author', async (req, res) => {
  const author = req.params.author;
  try {
    const booksByAuthor = Object.keys(books)
      .filter((key) => books[key].author === author)
      .map((key) => ({ isbn: key, ...books[key] }));

    if (booksByAuthor.length === 0) {
      return res.status(404).json({ message: 'No books found for this author' });
    }

    const response = await axios(axiosBooksAdapter(booksByAuthor));
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(404).json({ message: 'No books found for this author' });
  }
});

public_users.get('/title/:title', async (req, res) => {
  const title = req.params.title;
  try {
    const booksByTitle = Object.keys(books)
      .filter((key) => books[key].title === title)
      .map((key) => ({ isbn: key, ...books[key] }));

    if (booksByTitle.length === 0) {
      return res.status(404).json({ message: 'No books found with this title' });
    }

    const response = await axios(axiosBooksAdapter(booksByTitle));
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(404).json({ message: 'No books found with this title' });
  }
});

public_users.get('/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  if (books[isbn]) {
    return res.status(200).json(books[isbn].reviews || {});
  }
  return res.status(404).json({ message: 'Book not found' });
});

module.exports.general = public_users;
