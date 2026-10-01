const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

public_users.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  if (isValid(username)) {
    users.push({ username, password });
    return res.status(200).json({
      message: "User successfully registred. Now you can login",
    });
  }

  return res.status(404).json({ message: "User already exists!" });
});

const axiosGetBooks = () =>
  axios({
    url: 'internal://books',
    adapter: () =>
      Promise.resolve({
        data: books,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      }),
  });

const getBookByISBN = (isbn) =>
  new Promise((resolve, reject) => {
    if (books[isbn]) {
      resolve(books[isbn]);
    } else {
      reject(new Error("Book not found"));
    }
  });

const getBooksByAuthor = (author) =>
  new Promise((resolve, reject) => {
    const result = Object.keys(books)
      .filter(
        (key) => books[key].author.toLowerCase() === author.toLowerCase()
      )
      .map((key) => ({ isbn: key, ...books[key] }));

    if (result.length > 0) {
      resolve(result);
    } else {
      reject(new Error("No books found for this author"));
    }
  });

const getBooksByTitle = (title) =>
  new Promise((resolve, reject) => {
    const result = Object.keys(books)
      .filter((key) => books[key].title.toLowerCase() === title.toLowerCase())
      .map((key) => ({ isbn: key, ...books[key] }));

    if (result.length > 0) {
      resolve(result);
    } else {
      reject(new Error("No books found with this title"));
    }
  });

public_users.get('/', async (req, res) => {
  try {
    const { data: bookList } = await axiosGetBooks();
    return res.status(200).json(bookList);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

public_users.get('/isbn/:isbn', async (req, res) => {
  try {
    const book = await getBookByISBN(req.params.isbn);
    return res.status(200).json(book);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
});

public_users.get('/author/:author', async (req, res) => {
  try {
    const booksByAuthor = await getBooksByAuthor(req.params.author);
    return res.status(200).json(booksByAuthor);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
});

public_users.get('/title/:title', async (req, res) => {
  try {
    const booksByTitle = await getBooksByTitle(req.params.title);
    return res.status(200).json(booksByTitle);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
});

public_users.get('/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  if (books[isbn]) {
    return res.status(200).json(books[isbn].reviews || {});
  }
  return res.status(404).json({ message: "Book not found" });
});

module.exports.general = public_users;
