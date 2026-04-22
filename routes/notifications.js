const express      = require('express');
const Notification = require('../models/Notification');
const { requireAuth } = require('../middleware/auth');
const router       = express.Router();

router.use(requireAuth);

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const filter = req.query.filter || 'all';
    const query  = { user_id: req.session.user.id };
    if (filter === 'unread') query.is_read = false;

    const notifs = await Notification.find(query)
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      user_id: req.session.user.id, is_read: false,
    });

    const out = notifs.map(n => ({ ...n, id: n._id.toString(), user_id: n.user_id.toString() }));
    res.json({ notifications: out, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/read-all — must be BEFORE /:id
router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ user_id: req.session.user.id, is_read: false }, { is_read: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res) => {
  try {
    const result = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.session.user.id },
      { is_read: true },
    );
    if (!result) return res.status(404).json({ error: 'Notification not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
