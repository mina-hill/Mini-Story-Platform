// routes/stories.js
const express = require('express');
const { getDb } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ---- helpers ---------------------------------------------------------

async function likeCount(db, storyId) {
  const row = await db.get('SELECT COUNT(*) AS n FROM likes WHERE storyId = ?', storyId);
  return row ? row.n : 0;
}

function trendingScore(likes, publishedAt) {
  const hours = (Date.now() - new Date(publishedAt + 'Z').getTime()) / 36e5;
  return likes / Math.pow(Math.max(hours, 0) + 2, 1.5);
}

// ---- create / edit -----------------------------------------------------

// Decision #1: POST /api/stories - Validate title before DB. Default 'draft' status.
router.post('/', requireAuth, async (req, res) => {
  const { title, content, status } = req.body || {};

  if (typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title cannot be empty' });
  }

  const finalStatus = status === 'published' ? 'published' : 'draft';
  const publishedAt = finalStatus === 'published' ? new Date().toISOString() : null;

  try {
    const db = await getDb();
    const info = await db.run(
      `INSERT INTO stories (title, content, authorId, status, publishedAt)
       VALUES (?, ?, ?, ?, ?)`,
      title.trim(), content || '', req.user.id, finalStatus, publishedAt
    );

    res.status(201).json({ id: info.lastID, title: title.trim(), status: finalStatus });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Decision #2: PUT /api/stories/:id - 404/403 guards, same title validation. Toggle draft/published.
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const story = await db.get('SELECT * FROM stories WHERE id = ?', req.params.id);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    if (story.authorId !== req.user.id) return res.status(403).json({ error: 'Not your story' });

    const { title, content, status } = req.body || {};

    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    const newTitle = title !== undefined ? title.trim() : story.title;
    const newContent = content !== undefined ? content : story.content;
    const newStatus = status === 'published' || status === 'draft' ? status : story.status;
    const newPublishedAt = newStatus === 'published'
      ? (story.publishedAt || new Date().toISOString())
      : null;

    await db.run(
      `UPDATE stories SET title = ?, content = ?, status = ?, publishedAt = ? WHERE id = ?`,
      newTitle, newContent, newStatus, newPublishedAt, story.id
    );

    res.json({ id: story.id, title: newTitle, status: newStatus });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ---- listing (published only, trending sort) ---------------------------

// Decision #3: GET /api/stories - CRITICAL: SQL query filters WHERE status = 'published'.
// Drafts cannot leak. Supports trending/liked/recent sorts with gravity decay.
router.get('/', optionalAuth, async (req, res) => {
  const sort = req.query.sort === 'recent' ? 'recent'
             : req.query.sort === 'liked' ? 'liked'
             : 'trending'; // default

  try {
    const db = await getDb();
    const rows = await db.all(`
      SELECT s.id, s.title, s.createdAt, s.publishedAt, u.name AS authorName,
             (SELECT COUNT(*) FROM likes l WHERE l.storyId = s.id) AS likes
      FROM stories s
      JOIN users u ON u.id = s.authorId
      WHERE s.status = 'published'
    `);

    let result = rows.map(r => ({ ...r, score: trendingScore(r.likes, r.publishedAt) }));

    if (sort === 'recent') {
      result.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    } else if (sort === 'liked') {
      result.sort((a, b) => b.likes - a.likes);
    } else {
      result.sort((a, b) => b.score - a.score);
    }

    res.json({ sort, stories: result });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ---- reader: single published story (or author viewing own draft) ------

// Decision #4: GET /api/stories/:id - Only return draft if req.user is author. Include likes state.
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.user ? req.user.id : -1;
    const story = await db.get(`
      SELECT s.*, u.name AS authorName FROM stories s
      JOIN users u ON u.id = s.authorId
      WHERE s.id = ? AND (s.status = 'published' OR s.authorId = ?)
    `, req.params.id, userId);

    if (!story) return res.status(404).json({ error: 'Story not found' });

    const likes = await likeCount(db, story.id);
    let likedByMe = false;
    if (req.user) {
      const row = await db.get('SELECT 1 FROM likes WHERE storyId = ? AND userId = ?', story.id, req.user.id);
      likedByMe = !!row;
    }

    res.json({ ...story, likes, likedByMe });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ---- like toggle ---------------------------------------------------------

// Decision #5: POST /api/stories/:id/like - Toggle like. Uses UNIQUE constraint on DB to prevent race conditions.
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const story = await db.get('SELECT id, status FROM stories WHERE id = ?', req.params.id);
    if (!story || story.status !== 'published') {
      return res.status(404).json({ error: 'Story not found' });
    }

    const existing = await db.get('SELECT id FROM likes WHERE storyId = ? AND userId = ?', story.id, req.user.id);

    if (existing) {
      await db.run('DELETE FROM likes WHERE id = ?', existing.id);
      const likes = await likeCount(db, story.id);
      return res.json({ liked: false, likes });
    } else {
      try {
        await db.run('INSERT INTO likes (storyId, userId) VALUES (?, ?)', story.id, req.user.id);
      } catch (e) {
        // UNIQUE constraint caught a race (double-click) — treat as already liked.
      }
      const likes = await likeCount(db, story.id);
      return res.json({ liked: true, likes });
    }
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
