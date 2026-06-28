// server.js
const express = require('express');
const path = require('path');

const authRoutes = require('./routes/auth');
const storyRoutes = require('./routes/stories');
const commentRoutes = require('./routes/comments');

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/stories', commentRoutes); // mounted same prefix: /api/stories/:storyId/comments

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'list.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Mini Story Platform running on http://localhost:${PORT}`));
