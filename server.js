const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const FileStore = require('session-file-store')(session);

// Ensure sessions + uploads dirs exist
const sessionsDir = path.join(__dirname, 'sessions');
const uploadsDir  = path.join(__dirname, 'uploads');
[sessionsDir, uploadsDir].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }) });

require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store: new FileStore({
    path: sessionsDir,
    ttl: 7 * 24 * 60 * 60,
    reapInterval: 3600,
    logFn: () => {}
  }),
  secret: process.env.SESSION_SECRET || 'workify-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'lax' }
}));

// Serve uploaded avatars BEFORE static (so they're not overwritten by SPA fallback)
app.use('/uploads', express.static(uploadsDir));

// Serve built React app
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/jobs',         require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/profile',      require('./routes/profile'));
app.use('/api/ratings',      require('./routes/ratings'));
app.use('/api/messages',     require('./routes/messages'));
app.use('/api/notifications',require('./routes/notifications'));
app.use('/api/admin',        require('./routes/admin'));

// SPA fallback — send index.html for all non-API GET requests
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

app.listen(PORT, () => {
  console.log(`\n  ✨ Workify running at http://localhost:${PORT}\n`);
});
