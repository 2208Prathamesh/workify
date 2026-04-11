const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

// GET /api/jobs — list active jobs (public for seekers, filtered for employers)
router.get('/', (req, res) => {
  try {
    const { search, location, skill } = req.query;
    let query = `
      SELECT j.*, u.name as employer_name
      FROM jobs j
      JOIN users u ON j.employer_id = u.id
      WHERE j.status = 'active'
    `;
    const params = [];

    if (search) {
      query += ` AND (j.title LIKE ? OR j.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (location) {
      query += ` AND j.location LIKE ?`;
      params.push(`%${location}%`);
    }
    if (skill) {
      query += ` AND j.skills_required LIKE ?`;
      params.push(`%${skill}%`);
    }

    query += ` ORDER BY j.created_at DESC`;
    const jobs = db.prepare(query).all(...params);
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/mine — employer's own jobs
router.get('/mine', requireRole('employer'), (req, res) => {
  try {
    const jobs = db.prepare(`
      SELECT j.*,
        (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count
      FROM jobs j
      WHERE j.employer_id = ? AND j.status != 'removed'
      ORDER BY j.created_at DESC
    `).all(req.session.user.id);
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/saved — seeker's saved jobs (server-side, no localStorage)
router.get('/saved', requireAuth, (req, res) => {
  try {
    const jobs = db.prepare(`
      SELECT j.*, u.name as employer_name
      FROM saved_jobs s
      JOIN jobs j ON s.job_id = j.id
      JOIN users u ON j.employer_id = u.id
      WHERE s.user_id = ? AND j.status = 'active'
      ORDER BY s.created_at DESC
    `).all(req.session.user.id);
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /api/jobs/:id
router.get('/:id', (req, res) => {
  try {
    const job = db.prepare(`
      SELECT j.*, u.name as employer_name
      FROM jobs j JOIN users u ON j.employer_id = u.id
      WHERE j.id = ?
    `).get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/jobs — create a job (employer only)
router.post('/', requireRole('employer'), (req, res) => {
  try {
    const {
      title, description, skills_required, duration, salary, location,
      food_included, transport_included, category, pay_type, urgency, workers_needed
    } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    const result = db.prepare(`
      INSERT INTO jobs
        (employer_id, title, description, skills_required, duration, salary, location,
         food_included, transport_included, category, pay_type, urgency, workers_needed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.session.user.id, title, description,
      skills_required || '', duration || '', salary || '', location || '',
      food_included ? 1 : 0, transport_included ? 1 : 0,
      category || 'General', pay_type || 'negotiable',
      urgency || 'normal', workers_needed || 1
    );
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);
    res.json({ job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/jobs/:id — update a job
router.put('/:id', requireRole('employer'), (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND employer_id = ?').get(req.params.id, req.session.user.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const { title, description, skills_required, duration, salary, location, food_included, transport_included, status } = req.body;
    db.prepare(`
      UPDATE jobs SET title=?, description=?, skills_required=?, duration=?, salary=?, location=?, food_included=?, transport_included=?, status=?
      WHERE id = ?
    `).run(
      title || job.title, description || job.description,
      skills_required !== undefined ? skills_required : job.skills_required,
      duration !== undefined ? duration : job.duration,
      salary !== undefined ? salary : job.salary,
      location !== undefined ? location : job.location,
      food_included !== undefined ? (food_included ? 1 : 0) : job.food_included,
      transport_included !== undefined ? (transport_included ? 1 : 0) : job.transport_included,
      status || job.status,
      req.params.id
    );
    const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    res.json({ job: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', requireRole('employer', 'admin'), (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    // Employers can only delete their own jobs, admins can delete any
    if (req.session.user.role === 'employer' && job.employer_id !== req.session.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    db.prepare("UPDATE jobs SET status = 'removed' WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/:id/applicants — see applicants for a job (employer only)
router.get('/:id/applicants', requireRole('employer', 'admin'), (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (req.session.user.role === 'employer' && job.employer_id !== req.session.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const applicants = db.prepare(`
      SELECT a.id, a.status, a.created_at, a.decline_reason, a.cancel_reason,
             u.id as user_id, u.name, u.email, u.avatar_url, u.verified,
             p.skills, p.location, p.availability, p.contact_phone, p.bio,
             p.languages, p.daily_rate, p.whatsapp, p.availability_status, p.portfolio
      FROM applications a
      JOIN users u ON a.seeker_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE a.job_id = ?
      ORDER BY a.created_at DESC
    `).all(req.params.id);

    // Scrub contact info if not accepted
    const safeApplicants = applicants.map(app => {
      if (app.status !== 'accepted') {
        app.email = null;
        app.contact_phone = null;
        app.whatsapp = null;
      }
      return app;
    });

    res.json({ applicants: safeApplicants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/jobs/:id/save — save a job (server-side, replaces localStorage)
router.post('/:id/save', requireAuth, (req, res) => {
  try {
    db.prepare('INSERT OR IGNORE INTO saved_jobs (user_id, job_id) VALUES (?, ?)')
      .run(req.session.user.id, req.params.id);
    res.json({ ok: true, saved: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/jobs/:id/save — unsave a job
router.delete('/:id/save', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?')
      .run(req.session.user.id, req.params.id);
    res.json({ ok: true, saved: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/:id/saved-status — check if a specific job is saved
router.get('/:id/saved-status', requireAuth, (req, res) => {
  try {
    const row = db.prepare('SELECT 1 FROM saved_jobs WHERE user_id = ? AND job_id = ?')
      .get(req.session.user.id, req.params.id);
    res.json({ saved: !!row });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
