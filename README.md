# Mini Story Platform

A minimalist, high-performance publishing platform for reading, writing, and engaging with stories.


A lightweight Medium/Substack clone: write a story, save as draft or publish,
browse published stories, like and comment.

## Stack
Node.js + Express + sqlite3 (file DB, zero setup) + JWT auth.
Frontend: plain HTML/CSS/JS (no build step), served as static files by Express.

## Setup

```bash
npm install
npm start
```

Open http://localhost:3000 — it serves `/list.html` by default.

The SQLite file is created automatically at `data/app.db` on first run.

## Screens
- `/login.html` — login / register (toggle button switches mode)
- `/write.html` — write a story; "Save as Draft" or "Publish"; `?id=` to edit an existing one
- `/list.html` — published stories, sortable via `?sort=trending|liked|recent`
- `/story.html?id=` — read a story, like/unlike, view + add comments

## API summary
- `POST /api/auth/register`, `POST /api/auth/login`
- `POST /api/stories` (create, draft or published)
- `PUT /api/stories/:id` (edit, author only)
- `GET /api/stories?sort=trending|liked|recent` (published only)
- `GET /api/stories/:id` (published, or own draft)
- `POST /api/stories/:id/like` (toggle)
- `GET /api/stories/:id/comments`, `POST /api/stories/:id/comments`

---

## Decisions Write-up (150 words max)

**1. Trending Calculation:** `score = likes / Math.pow(Math.max(hours, 0) + 2, 1.5)` is used. This Hacker-News style gravity formula allows newer stories with modest likes to compete, preventing older viral stories from dominating forever.

**2. Double-Like Prevention:** The `likes` table uses a schema-level `UNIQUE(storyId, userId)` constraint. We safely catch this database-level constraint violation during a race condition, correctly preventing duplicate entries.

**3. Draft Privacy:** Enforced strictly at the SQL level via `WHERE s.status = 'published'`. Single story views use `WHERE s.id = ? AND (s.status = 'published' OR s.authorId = ?)`, guaranteeing drafts cannot leak via JavaScript oversight.

**4. Malformed Input:** Blank or whitespace-only titles trigger a `400 { error: 'Title cannot be empty' }` explicitly before the application attempts any database write.
