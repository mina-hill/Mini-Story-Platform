// db/index.js
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let dbPromise = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = open({
      filename: path.join(__dirname, '../../data', 'app.db'),
      driver: sqlite3.Database
    }).then(async db => {
      await db.run('PRAGMA journal_mode = WAL');
      await db.run('PRAGMA foreign_keys = ON');

      await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id        INTEGER PRIMARY KEY AUTOINCREMENT,
          name      TEXT NOT NULL,
          email     TEXT NOT NULL UNIQUE,
          password  TEXT NOT NULL,
          createdAt TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS stories (
          id        INTEGER PRIMARY KEY AUTOINCREMENT,
          title     TEXT NOT NULL,
          content   TEXT NOT NULL DEFAULT '',
          authorId  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status    TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
          createdAt TEXT NOT NULL DEFAULT (datetime('now')),
          publishedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS likes (
          id       INTEGER PRIMARY KEY AUTOINCREMENT,
          storyId  INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
          userId   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(storyId, userId)
        );

        CREATE TABLE IF NOT EXISTS comments (
          id        INTEGER PRIMARY KEY AUTOINCREMENT,
          storyId   INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
          userId    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          text      TEXT NOT NULL,
          timestamp TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
      return db;
    });
  }
  return dbPromise;
}

module.exports = { getDb };
