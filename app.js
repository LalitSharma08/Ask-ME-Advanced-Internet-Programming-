
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'quoraclone-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Lalit@08',
  database: 'quora_clone'
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Modified login to auto-create user if not exists
app.post('/login', (req, res) => {
  const { username } = req.body;
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) return res.status(500).send('Database error');

    if (results.length > 0) {
      req.session.username = username;
      res.redirect('/');
    } else {
      db.query('INSERT INTO users (username) VALUES (?)', [username], (insertErr) => {
        if (insertErr) return res.status(500).send('Registration error');
        req.session.username = username;
        res.redirect('/');
      });
    }
  });
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Could not log out.');
    } else {
      res.redirect('/');
    }
  });
});

app.post('/post', (req, res) => {
  if (!req.session.username) return res.status(401).send('Login required');
  const { content } = req.body;
  db.query('INSERT INTO posts (username, content) VALUES (?, ?)', [req.session.username, content], (err) => {
    if (err) return res.status(500).send('Database error');
    res.redirect('/');
  });
});

// Get all posts
app.get('/posts', (req, res) => {
  db.query('SELECT * FROM posts ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).send('Database error');
    res.json(results);
  });
});

// Check session status
app.get('/session', (req, res) => {
  if (req.session.username) {
    res.json({ loggedIn: true, username: req.session.username });
  } else {
    res.json({ loggedIn: false });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
