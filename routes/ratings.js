const express     = require('express');
const Rating      = require('../models/Rating');
const Application = require('../models/Application');
const User        = require('../models/User');
const Job         = require('../models/Job');
const { requireAuth } = require('../middleware/auth');
const router      = express.Router();

// GET /api/ratings/user/:id — public ratings for a seeker
router.get('/user/:id', async (req, res) => {
  try {
    const ratings = await Rating.find({ seeker_id: req.params.id })
      .populate('employer_id', 'name avatar_url')
      .populate('job_id',      'title')
      .sort({ created_at: -1 })
      .lean();

    const out = ratings.map(r => ({
      id:              r._id.toString(),
      stars:           r.stars,
      review:          r.review,
      created_at:      r.created_at,
      reviewer_name:   r.employer_id?.name,
      reviewer_avatar: r.employer_id?.avatar_url,
      job_title:       r.job_id?.title,
    }));

    const avg = out.length > 0
      ? parseFloat((out.reduce((s, r) => s + r.stars, 0) / out.length).toFixed(1))
      : null;

    res.json({ ratings: out, avg, count: out.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ratings — employer rates a seeker
router.post('/', requireAuth, async (req, res) => {
  if (!['employer', 'admin'].includes(req.session.user.role))
    return res.status(403).json({ error: 'Only employers can rate workers' });

  try {
    const { seeker_id, job_id, stars, review } = req.body;
    if (!seeker_id || !stars) return res.status(400).json({ error: 'seeker_id and stars are required' });
    if (stars < 1 || stars > 5) return res.status(400).json({ error: 'Stars must be between 1 and 5' });

    // Verify the employer actually hired this seeker
    if (job_id) {
      const hired = await Application.findOne({
        job_id, seeker_id, status: 'accepted',
      });
      if (!hired) return res.status(403).json({ error: 'You can only rate workers you have hired' });
    }

    const rating = await Rating.findOneAndUpdate(
      { seeker_id, employer_id: req.session.user.id, job_id: job_id || null },
      { stars, review: review || '', created_at: new Date() },
      { upsert: true, new: true }
    );

    res.json({ ok: true, id: rating._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/ratings/:id — employer deletes own rating
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await Rating.findOneAndDelete({ _id: req.params.id, employer_id: req.session.user.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
