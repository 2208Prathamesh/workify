const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name || !role)
      return res.status(400).json({ error: 'All fields are required' });
    if (!['seeker', 'employer'].includes(role))
      return res.status(400).json({ error: 'Invalid role' });

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)'
    ).run(email, hash, name, role);

    // Always create a profile row
    db.prepare(`
      INSERT OR IGNORE INTO profiles
        (user_id, skills, location, availability, contact_phone, bio, experience,
         languages, daily_rate, work_type, availability_status, whatsapp, portfolio)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(result.lastInsertRowid, '', '', 'Full-time', '', '', '', '', '', 'Any', 'looking', '', '[]');

    const user = db.prepare(
      'SELECT id, email, name, role, verified, avatar_url, created_at FROM users WHERE id = ?'
    ).get(result.lastInsertRowid);

    req.session.user = user;
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: 'Invalid email or password' });

    const { password: _, ...safeUser } = user;
    req.session.user = safeUser;
    res.json({ user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// GET /api/auth/me  ← BUG FIX: was selecting 'avatar' not 'avatar_url'
router.get('/me', (req, res) => {
  if (!req.session?.user)
    return res.status(401).json({ error: 'Not logged in' });

  const user = db.prepare(
    'SELECT id, email, name, role, verified, avatar_url, lang_pref, created_at FROM users WHERE id = ?'
  ).get(req.session.user.id);

  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'User not found' });
  }
  req.session.user = user;
  res.json({ user });
});

// PUT /api/auth/lang — save language preference to DB (no localStorage needed)
router.put('/lang', (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: 'Unauthorized' });
  const { lang } = req.body;
  if (!['en', 'hi', 'mr'].includes(lang)) return res.status(400).json({ error: 'Invalid lang' });

  try {
    db.prepare('UPDATE users SET lang_pref = ? WHERE id = ?').run(lang, req.session.user.id);
    req.session.user.lang_pref = lang;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
