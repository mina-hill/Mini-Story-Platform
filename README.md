# Mini Story Platform

A lightweight Medium/Substack clone: write a story, save as draft or publish,
browse published stories, like and comment.

## Stack
Node.js + Express + better-sqlite3 (file DB, zero setup) + JWT auth.
Frontend: plain HTML/CSS/JS (no build step), served as static files by Express.

## Run it

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

## Decisions write-up (≤150 words)

**1. Trending calculation:** `score = likes / (hoursSincePublished + 2)^1.5`
— a Hacker-News-style gravity formula. Pure like-count would let old viral
stories dominate forever; this lets fresh stories with modest likes compete
while still rewarding genuine popularity. `liked` and `recent` are offered
as alternate sort modes.

**2. Double-like prevention:** the `likes` table has `UNIQUE(storyId, userId)`.
The toggle endpoint checks for an existing row and deletes it (unlike) or
inserts it (like); a race-condition double-insert is caught by the DB
constraint itself, not just app logic — so it's correct even under concurrent
clicks.

**3. Drafts never public:** every public query (listing, reader) hardcodes
`WHERE status = 'published'` in the SQL itself, not as a post-fetch filter.
The reader endpoint additionally lets only the author view their own draft.

**Malformed input handled:** empty/whitespace-only `title` on create/edit →
`400 { error: "Title cannot be empty" }`, validated before any DB write.
