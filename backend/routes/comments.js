// routes/comments.js
const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/:storyId/comments', async (req, res) => {
  try {
    const db = await getDb();
    const story = await db.get('SELECT id, status FROM stories WHERE id = ?', req.params.storyId);
    if (!story || story.status !== 'published') {
      return res.status(404).json({ error: 'Story not found' });
    }

    const comments = await db.all(`
      SELECT c.id, c.text, c.timestamp, u.name AS userName
      FROM comments c JOIN users u ON u.id = c.userId
      WHERE c.storyId = ?
      ORDER BY c.timestamp ASC
    `, story.id);

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/:storyId/comments', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const story = await db.get('SELECT id, status FROM stories WHERE id = ?', req.params.storyId);
    if (!story || story.status !== 'published') {
      return res.status(404).json({ error: 'Story not found' });
    }

    const { text } = req.body || {};
    if (typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text cannot be empty' });
    }

    const info = await db.run(
      'INSERT INTO comments (storyId, userId, text) VALUES (?, ?, ?)',
      story.id, req.user.id, text.trim()
    );

    res.status(201).json({
      id: info.lastID,
      text: text.trim(),
      userName: req.user.name,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
