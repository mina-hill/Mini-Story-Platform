const bcrypt = require('bcryptjs');
const { getDb } = require('./backend/db');

async function seed() {
  const db = await getDb();
  
  const countRow = await db.get('SELECT COUNT(*) AS count FROM users');
  if (countRow && countRow.count > 0) {
    console.log('Database already seeded, skipping.');
    process.exit(0);
  }

  console.log('Seeding database with demo data...');

  try {
    await db.run('BEGIN TRANSACTION');

    const passwordHash = bcrypt.hashSync('password123', 10);
    const users = [
      { name: 'Alice Author', email: 'alice@example.com' },
      { name: 'Bob Blogger', email: 'bob@example.com' },
      { name: 'Charlie Critic', email: 'charlie@example.com' },
      { name: 'Diana Drafts', email: 'diana@example.com' }
    ];

    const userIds = [];
    for (const u of users) {
      const res = await db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', u.name, u.email, passwordHash);
      userIds.push(res.lastID);
    }

    const nowMs = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const stories = [
      { title: 'The Future of Web Development in 2026', content: 'Web development is evolving faster than ever. New frameworks and methodologies are emerging, making it easier to build responsive, high-performance applications.', authorId: userIds[0], status: 'published', publishedAt: new Date(nowMs - 2 * dayMs).toISOString() },
      { title: 'Why I Stopped Using Complex Build Tools', content: 'For years I struggled with complex configurations, Webpack, Babel, and endless dependencies. Recently, I switched back to vanilla JS and native browser features. It has been a breath of fresh air.', authorId: userIds[1], status: 'published', publishedAt: new Date(nowMs - 5 * dayMs).toISOString() },
      { title: 'Understanding CSS Grid and Flexbox', content: 'CSS Grid and Flexbox are two of the most powerful layout systems available in modern CSS. In this article, I will explain when to use which.', authorId: userIds[2], status: 'published', publishedAt: new Date(nowMs - 10 * dayMs).toISOString() },
      { title: 'A Beginner’s Guide to Node.js', content: 'Node.js allows you to run JavaScript on the server. This guide will walk you through setting up your first Express server.', authorId: userIds[0], status: 'published', publishedAt: new Date(nowMs - 20 * dayMs).toISOString() },
      { title: 'Mastering SQL for Backend Developers', content: 'SQL is the backbone of most web applications. Even with ORMs, understanding how to write raw queries is an essential skill.', authorId: userIds[1], status: 'published', publishedAt: new Date(nowMs - 15 * dayMs).toISOString() },
      { title: 'The Importance of UI Aesthetics', content: 'A good UI is not just about looking pretty; it is about trust and usability. Glassmorphism and micro-animations can elevate an app from good to great.', authorId: userIds[2], status: 'published', publishedAt: new Date(nowMs - 1 * dayMs).toISOString() },
      { title: 'Draft: My thoughts on AI', content: 'I am still forming my opinions on artificial intelligence and its impact on the coding industry.', authorId: userIds[3], status: 'draft', publishedAt: null },
      { title: 'Draft: Top 10 JS Tricks', content: 'Here is a list of some cool JS tricks.', authorId: userIds[0], status: 'draft', publishedAt: null }
    ];

    const storyIds = [];
    let publishedCount = 0;
    let draftCount = 0;
    for (const s of stories) {
      const res = await db.run('INSERT INTO stories (title, content, authorId, status, publishedAt) VALUES (?, ?, ?, ?, ?)', s.title, s.content, s.authorId, s.status, s.publishedAt);
      storyIds.push(res.lastID);
      if (s.status === 'published') publishedCount++;
      else draftCount++;
    }

    // Seed likes (only on published stories, varying amounts)
    // Story 0 gets 3 likes
    // Story 1 gets 2 likes
    // Story 5 gets 1 like
    // Others get 0 likes
    const likes = [
      { storyId: storyIds[0], userId: userIds[1] },
      { storyId: storyIds[0], userId: userIds[2] },
      { storyId: storyIds[0], userId: userIds[3] },
      { storyId: storyIds[1], userId: userIds[0] },
      { storyId: storyIds[1], userId: userIds[2] },
      { storyId: storyIds[5], userId: userIds[0] }
    ];

    let likesCount = 0;
    for (const l of likes) {
      await db.run('INSERT INTO likes (storyId, userId) VALUES (?, ?)', l.storyId, l.userId);
      likesCount++;
    }

    // Seed comments
    const comments = [
      { storyId: storyIds[0], userId: userIds[1], text: 'Great read! I totally agree about the upcoming trends.' },
      { storyId: storyIds[0], userId: userIds[2], text: 'Thanks for sharing. I found the section on performance particularly useful.' },
      { storyId: storyIds[1], userId: userIds[3], text: 'Vanilla JS is definitely making a huge comeback.' },
      { storyId: storyIds[5], userId: userIds[0], text: 'Aesthetics matter so much more than people realize!' }
    ];

    let commentsCount = 0;
    for (const c of comments) {
      await db.run('INSERT INTO comments (storyId, userId, text) VALUES (?, ?, ?)', c.storyId, c.userId, c.text);
      commentsCount++;
    }

    await db.run('COMMIT');

    console.log('✅ Seed successful!');
    console.log(`- Created ${users.length} users`);
    console.log(`- Created ${publishedCount} published stories and ${draftCount} drafts`);
    console.log(`- Created ${likesCount} likes and ${commentsCount} comments`);
    console.log('\n========================================');
    console.log('DEMO LOGIN CREDENTIALS');
    console.log('========================================');
    for (const u of users) {
      console.log(`Email:    ${u.email}`);
      console.log(`Password: password123\n`);
    }

  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Seed failed, rolled back changes:', error);
    process.exit(1);
  }
}

seed().catch(console.error);
