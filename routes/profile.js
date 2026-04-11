const express = require('express');
const path = require('path');
const multer = require('multer');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// ── Avatar upload config ───────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `avatar-${req.session.user.id}-${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// ── GET /api/profile — own profile ───────────────────────────
router.get('/', requireAuth, (req, res) => {
  try {
    const profile = db.prepare(`
      SELECT p.*, u.name, u.email, u.role, u.avatar_url, u.verified
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
    `).get(req.session.user.id);

    if (!profile) {
      const user = db.prepare(
        'SELECT id, email, name, role, avatar_url, verified, created_at FROM users WHERE id = ?'
      ).get(req.session.user.id);
      return res.json({ profile: user });
    }
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/profile/:id — PUBLIC profile view ───────────────
router.get('/:id', (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, name, role, avatar_url, verified, created_at FROM users WHERE id = ?'
    ).get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const profile = db.prepare(
      'SELECT * FROM profiles WHERE user_id = ?'
    ).get(req.params.id);

    const ratingData = db.prepare(`
      SELECT AVG(stars) AS avg, COUNT(*) AS count
      FROM ratings WHERE seeker_id = ?
    `).get(req.params.id);

    res.json({
      user,
      profile: profile || {},
      rating: {
        avg:   ratingData.avg   ? parseFloat(ratingData.avg.toFixed(1))  : null,
        count: ratingData.count || 0,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/profile — update own profile ────────────────────
router.put('/', requireAuth, (req, res) => {
  try {
    const {
      name, skills, location, availability, contact_phone,
      bio, experience, languages, daily_rate, work_type,
      availability_status, whatsapp, portfolio
    } = req.body;

    if (name) {
      db.prepare('UPDATE users SET name=? WHERE id=?').run(name, req.session.user.id);
      req.session.user.name = name;
    }

    const isSeeker = req.session.user.role === 'seeker';
    const existing = db.prepare('SELECT id FROM profiles WHERE user_id=?').get(req.session.user.id);

    if (isSeeker) {
      const data = [
        skills || '', location || '', availability || 'Full-time',
        contact_phone || '', bio || '', experience || '',
        languages || '', daily_rate || '', work_type || 'Any',
        availability_status || 'looking', whatsapp || '',
        JSON.stringify(Array.isArray(portfolio) ? portfolio : [])
      ];
      if (existing) {
        db.prepare(`
          UPDATE profiles SET
            skills=?, location=?, availability=?, contact_phone=?,
            bio=?, experience=?, languages=?, daily_rate=?, work_type=?,
            availability_status=?, whatsapp=?, portfolio=?
          WHERE user_id=?
        `).run(...data, req.session.user.id);
      } else {
        db.prepare(`
          INSERT INTO profiles
            (user_id, skills, location, availability, contact_phone,
             bio, experience, languages, daily_rate, work_type,
             availability_status, whatsapp, portfolio)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).run(req.session.user.id, ...data);
      }
    } else {
      // employer — just phone + whatsapp
      if (existing) {
        db.prepare('UPDATE profiles SET contact_phone=?, whatsapp=?, location=? WHERE user_id=?')
          .run(contact_phone || '', whatsapp || '', location || '', req.session.user.id);
      } else {
        db.prepare('INSERT INTO profiles (user_id, contact_phone, whatsapp, location) VALUES (?,?,?,?)')
          .run(req.session.user.id, contact_phone || '', whatsapp || '', location || '');
      }
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/profile/avatar — upload avatar ─────────────────
router.post('/avatar', requireAuth, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/${req.file.filename}`;
    db.prepare('UPDATE users SET avatar_url=? WHERE id=?').run(url, req.session.user.id);
    req.session.user.avatar_url = url;
    res.json({ ok: true, url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/profile/gallery — upload work gallery images ─────
router.post('/gallery', requireAuth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ ok: true, url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
