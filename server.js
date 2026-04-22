// Force public DNS — must be FIRST before any MongoDB connections
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const connectDB = require('./lib/mongoose');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Connect to MongoDB ─────────────────────────────────────────
connectDB().then(() => {
  console.log('[MongoDB] Ready');
}).catch((err) => {
  console.error('[MongoDB] Connection error:', err.message);
  console.error('[MongoDB] Check: 1) Network Access on Atlas allows 0.0.0.0/0  2) MONGODB_URI is correct  3) Try mobile hotspot if DNS is blocked');
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Session (MongoDB-backed) ───────────────────────────────────
app.use(session({
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 7 * 24 * 60 * 60, // 7 days
  }),
  secret:            process.env.SESSION_SECRET || 'workify-secret-key-2026',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    maxAge:   7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
  },
}));

// ── API routes ─────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/jobs',         require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/profile',      require('./routes/profile'));
app.use('/api/ratings',      require('./routes/ratings'));
app.use('/api/messages',     require('./routes/messages'));
app.use('/api/notifications',require('./routes/notifications'));
app.use('/api/admin',        require('./routes/admin'));

// ── Serve built React app ──────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── SPA fallback ───────────────────────────────────────────────
app.use((req, res) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`\n  ✨ Workify running at http://localhost:${PORT}\n`);
});

module.exports = app; // for Vercel serverless
