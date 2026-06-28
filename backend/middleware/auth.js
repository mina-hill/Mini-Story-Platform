// middleware/auth.js
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Required: blocks request if no/invalid token.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing auth token' });
  try {
    req.user = jwt.verify(token, SECRET); // { id, name, email }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Optional: attaches req.user if a valid token is present, but never blocks.
// Used on public reader/listing endpoints so we can show "liked by me" state
// without requiring login to browse.
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try { req.user = jwt.verify(token, SECRET); } catch { /* ignore */ }
  }
  next();
}

module.exports = { requireAuth, optionalAuth, SECRET };
