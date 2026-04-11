const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// All routes require auth
router.use(requireAuth);

// ── GET /api/messages — inbox (unique conversations) ──────────
router.get('/', (req, res) => {
  try {
    const me = req.session.user.id;

    // Get all unique conversation partners with latest message + unread count
    const threads = db.prepare(`
      SELECT
        other.id         AS partner_id,
        other.name       AS partner_name,
        other.avatar_url AS partner_avatar,
        other.role       AS partner_role,
        last_msg.content AS last_message,
        last_msg.created_at AS last_at,
        last_msg.from_id    AS last_from,
        (SELECT COUNT(*) FROM messages
         WHERE from_id = other.id AND to_id = ? AND is_read = 0) AS unread_count
      FROM (
        SELECT CASE WHEN from_id = ? THEN to_id ELSE from_id END AS other_id,
               MAX(id) AS max_id
        FROM messages
        WHERE from_id = ? OR to_id = ?
        GROUP BY other_id
      ) conv
      JOIN users other ON other.id = conv.other_id
      JOIN messages last_msg ON last_msg.id = conv.max_id
      ORDER BY last_msg.created_at DESC
    `).all(me, me, me, me);

    const totalUnread = db.prepare(`
      SELECT COUNT(*) AS cnt FROM messages WHERE to_id = ? AND is_read = 0
    `).get(me)?.cnt || 0;

    res.json({ threads, totalUnread });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/messages/thread/:partnerId — full conversation ───
router.get('/thread/:partnerId', (req, res) => {
  try {
    const me = req.session.user.id;
    const partner = parseInt(req.params.partnerId);

    const messages = db.prepare(`
      SELECT m.*, j.title AS job_title
      FROM messages m
      LEFT JOIN jobs j ON m.job_id = j.id
      WHERE (m.from_id = ? AND m.to_id = ?) OR (m.from_id = ? AND m.to_id = ?)
      ORDER BY m.created_at ASC
    `).all(me, partner, partner, me);

    // Mark incoming as read
    db.prepare(`
      UPDATE messages SET is_read = 1 WHERE from_id = ? AND to_id = ? AND is_read = 0
    `).run(partner, me);

    const partnerUser = db.prepare(
      'SELECT id, name, avatar_url, role FROM users WHERE id = ?'
    ).get(partner);

    res.json({ messages, partner: partnerUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/messages — send a message ───────────────────────
router.post('/', (req, res) => {
  try {
    const { to_id, content, job_id } = req.body;
    const from_id = req.session.user.id;

    if (!to_id || !content?.trim())
      return res.status(400).json({ error: 'Recipient and content required' });
    if (to_id === from_id)
      return res.status(400).json({ error: 'Cannot message yourself' });

    // Verify recipient exists
    const recipient = db.prepare('SELECT id FROM users WHERE id = ?').get(to_id);
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

    const result = db.prepare(`
      INSERT INTO messages (from_id, to_id, job_id, content)
      VALUES (?, ?, ?, ?)
    `).run(from_id, to_id, job_id || null, content.trim());

    const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
    res.json({ ok: true, message: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/messages/unread — unread count (for badge) ───────
router.get('/unread', (req, res) => {
  try {
    const row = db.prepare(
      'SELECT COUNT(*) AS cnt FROM messages WHERE to_id = ? AND is_read = 0'
    ).get(req.session.user.id);
    res.json({ count: row?.cnt || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
