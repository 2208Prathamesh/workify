const express  = require('express');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
const Profile  = require('../models/Profile');
const router   = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name || !role)
      return res.status(400).json({ error: 'All fields are required' });
    if (!['seeker', 'employer'].includes(role))
      return res.status(400).json({ error: 'Invalid role' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hash, name, role });

    // Always create a profile row
    await Profile.create({ userId: user._id });

    const safeUser = _safe(user);
    req.session.user = safeUser;
    res.json({ user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Invalid email or password' });

    const safeUser = _safe(user);
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

// GET /api/auth/me
router.get('/me', async (req, res) => {
  if (!req.session?.user)
    return res.status(401).json({ error: 'Not logged in' });

  try {
    const user = await User.findById(req.session.user.id);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: 'User not found' });
    }
    const safeUser = _safe(user);
    req.session.user = safeUser;
    res.json({ user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/lang
router.put('/lang', async (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: 'Unauthorized' });
  const { lang } = req.body;
  if (!['en', 'hi', 'mr'].includes(lang))
    return res.status(400).json({ error: 'Invalid lang' });

  try {
    await User.findByIdAndUpdate(req.session.user.id, { lang_pref: lang });
    req.session.user.lang_pref = lang;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Helper: strip password, normalise id ──────────────────────
function _safe(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  obj.id = obj._id.toString();
  return obj;
}

module.exports = router;
