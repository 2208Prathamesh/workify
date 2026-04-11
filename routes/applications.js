const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');
const router = express.Router();

// POST /api/applications — seeker applies to a job
router.post('/', requireRole('seeker'), (req, res) => {
  try {
    const { job_id } = req.body;
    if (!job_id) return res.status(400).json({ error: 'job_id is required' });

    const job = db.prepare("SELECT * FROM jobs WHERE id = ? AND status = 'active'").get(job_id);
    if (!job) return res.status(404).json({ error: 'Job not found or not active' });

    const existing = db.prepare('SELECT id FROM applications WHERE job_id = ? AND seeker_id = ?').get(job_id, req.session.user.id);
    if (existing) return res.status(409).json({ error: 'Already applied' });

    db.prepare('INSERT INTO applications (job_id, seeker_id) VALUES (?, ?)').run(job_id, req.session.user.id);
    
    // Notify Employer (DB + Email)
    db.prepare("INSERT INTO notifications (user_id, type, message, link) VALUES (?, 'application', ?, ?)").run(job.employer_id, `New applicant for: ${job.title}`, `/applicants/${job.id}`);
    const employer = db.prepare('SELECT email, name FROM users WHERE id = ?').get(job.employer_id);
    if (employer && employer.email) {
      sendEmail(employer.email, `New Application for ${job.title}`, `
        <h3>Hi ${employer.name},</h3>
        <p>You have received a new application for your job posting: <b>${job.title}</b>.</p>
        <p>Login to your Workify dashboard to review the applicant.</p>
      `);
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/applications — seeker views their applications
router.get('/', requireRole('seeker'), (req, res) => {
  try {
    const applications = db.prepare(`
      SELECT a.*, j.title as job_title, j.salary, j.location as job_location, j.duration, j.status as job_status,
             u.name as employer_name, u.email as employer_email, 
             p.contact_phone as employer_phone, p.whatsapp as employer_whatsapp
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN users u ON j.employer_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE a.seeker_id = ?
      ORDER BY a.created_at DESC
    `).all(req.session.user.id);
    res.json({ applications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/applications/:id — employer accepts/rejects
router.put('/:id', requireRole('employer'), (req, res) => {
  try {
    const { status, decline_reason } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted or rejected' });
    }
    const app = db.prepare(`
      SELECT a.*, j.employer_id FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ?
    `).get(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });
    if (app.employer_id !== req.session.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (status === 'rejected') {
      db.prepare('UPDATE applications SET status = ?, decline_reason = ? WHERE id = ?')
        .run(status, decline_reason || '', req.params.id);
    } else {
      db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, req.params.id);
    }
    
    const seeker = db.prepare('SELECT email, name FROM users WHERE id = ?').get(app.seeker_id);
    const job = db.prepare('SELECT title FROM jobs WHERE id = ?').get(app.job_id);
    
    if (job) {
      db.prepare("INSERT INTO notifications (user_id, type, message, link) VALUES (?, 'status', ?, ?)").run(app.seeker_id, `Application ${status}: ${job.title}`, '/applications');
    }

    if (seeker && seeker.email && job) {
      if (status === 'accepted') {
        sendEmail(seeker.email, `Application Accepted: ${job.title}`, `<h3>Congratulations ${seeker.name}!</h3><p>Your application for <b>${job.title}</b> has been accepted by the employer.</p>`);
      } else {
        sendEmail(seeker.email, `Application Update: ${job.title}`, `<h3>Hi ${seeker.name},</h3><p>Your application for <b>${job.title}</b> was reviewed but unfortunately not accepted at this time.</p>`);
      }
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/applications/:id — seeker withdraws their pending application
router.delete('/:id', requireRole('seeker'), (req, res) => {
  try {
    const app = db.prepare('SELECT * FROM applications WHERE id = ? AND seeker_id = ?')
      .get(req.params.id, req.session.user.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });
    if (app.status !== 'pending') return res.status(400).json({ error: 'Only pending applications can be withdrawn without approval' });
    
    db.prepare("UPDATE applications SET status = 'withdrawn' WHERE id = ?").run(req.params.id);
    res.json({ ok: true, withdrawn: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/applications/:id/cancel — seeker requests cancel for accepted job
router.post('/:id/cancel', requireRole('seeker'), (req, res) => {
  try {
    const { cancel_reason } = req.body;
    if (!cancel_reason?.trim()) return res.status(400).json({ error: 'Reason for cancellation required' });

    const app = db.prepare('SELECT * FROM applications WHERE id = ? AND seeker_id = ?')
      .get(req.params.id, req.session.user.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });
    if (app.status !== 'accepted') return res.status(400).json({ error: 'Can only request cancel for accepted jobs' });

    db.prepare("UPDATE applications SET status = 'cancel_requested', cancel_reason = ? WHERE id = ?")
      .run(cancel_reason, req.params.id);
      
    const job = db.prepare('SELECT title, employer_id FROM jobs WHERE id = ?').get(app.job_id);
    if (job) {
      db.prepare("INSERT INTO notifications (user_id, type, message, link) VALUES (?, 'alert', ?, ?)").run(job.employer_id, `Worker cancellation requested: ${job.title}`, `/applicants/${job.id}`);
      const employer = db.prepare('SELECT email, name FROM users WHERE id = ?').get(job.employer_id);
      if (employer && employer.email) {
        sendEmail(employer.email, `Worker Cancelled: ${job.title}`, `<h3>Hi ${employer.name},</h3><p>A worker has requested to cancel their assignment for <b>${job.title}</b>.</p><p>Reason: ${cancel_reason}</p><p>Please approve this cancellation in your dashboard to release the slot.</p>`);
      }
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/applications/:id/approve-cancel — employer approves seeker's cancel request
router.put('/:id/approve-cancel', requireRole('employer'), (req, res) => {
  try {
    const app = db.prepare(`
      SELECT a.*, j.employer_id FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ?
    `).get(req.params.id);
    
    if (!app) return res.status(404).json({ error: 'Application not found' });
    if (app.employer_id !== req.session.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (app.status !== 'cancel_requested') return res.status(400).json({ error: 'No cancellation requested' });

    db.prepare("UPDATE applications SET status = 'cancelled' WHERE id = ?").run(req.params.id);
    
    const seeker = db.prepare('SELECT email, name FROM users WHERE id = ?').get(app.seeker_id);
    const job = db.prepare('SELECT title FROM jobs WHERE id = ?').get(app.job_id);
    
    if (job) {
      db.prepare("INSERT INTO notifications (user_id, type, message, link) VALUES (?, 'alert', ?, ?)").run(app.seeker_id, `Cancellation approved: ${job.title}`, '/applications');
    }

    if (seeker && seeker.email && job) {
      sendEmail(seeker.email, `Cancellation Approved: ${job.title}`, `<h3>Hi ${seeker.name},</h3><p>Your cancellation request for <b>${job.title}</b> has been approved by the employer.</p>`);
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
