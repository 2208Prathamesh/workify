const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// ── GET /api/ratings/user/:id — public ratings for a seeker ───
router.get('/user/:id', (req, res) => {
  try {
    const ratings = db.prepare(`
      SELECT r.id, r.stars, r.review, r.created_at,
             u.name AS reviewer_name, u.avatar_url AS reviewer_avatar,
             j.title AS job_title
      FROM ratings r
      JOIN users u ON r.employer_id = u.id
      LEFT JOIN jobs j ON r.job_id = j.id
      WHERE r.seeker_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.id);

    const avg = ratings.length > 0
      ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1)
      : null;

    res.json({ ratings, avg: avg ? parseFloat(avg) : null, count: ratings.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/ratings — employer rates a seeker ───────────────
router.post('/', requireAuth, (req, res) => {
  if (req.session.user.role !== 'employer' && req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only employers can rate workers' });
  }
  try {
    const { seeker_id, job_id, stars, review } = req.body;
    if (!seeker_id || !stars) return res.status(400).json({ error: 'seeker_id and stars are required' });
    if (stars < 1 || stars > 5) return res.status(400).json({ error: 'Stars must be between 1 and 5' });

    // Verify the employer actually hired this seeker (accepted application)
    if (job_id) {
      const hired = db.prepare(`
        SELECT 1 FROM applications
        WHERE job_id=? AND seeker_id=? AND status='accepted'
      `).get(job_id, seeker_id);
      if (!hired) return res.status(403).json({ error: 'You can only rate workers you have hired' });
    }

    const result = db.prepare(`
      INSERT INTO ratings (seeker_id, employer_id, job_id, stars, review)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(seeker_id, employer_id, job_id) DO UPDATE SET
        stars=excluded.stars, review=excluded.review, created_at=datetime('now')
    `).run(seeker_id, req.session.user.id, job_id || null, stars, review || '');

    res.json({ ok: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/ratings/:id — employer deletes own rating ─────
router.delete('/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM ratings WHERE id=? AND employer_id=?')
      .run(req.params.id, req.session.user.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
