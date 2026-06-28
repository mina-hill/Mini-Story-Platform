// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
const { SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are all required' });
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const db = await getDb();
    const existing = await db.get('SELECT id FROM users WHERE email = ?', email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = bcrypt.hashSync(password, 10);
    const info = await db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', name, email, hash);

    const user = { id: info.lastID, name, email };
    const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const db = await getDb();
    const row = await db.get('SELECT * FROM users WHERE email = ?', email);
    if (!row || !bcrypt.compareSync(password, row.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = { id: row.id, name: row.name, email: row.email };
    const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
