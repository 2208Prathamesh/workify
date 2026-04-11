const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');
const nodemailer = require('nodemailer');
const { sendRawEmail } = require('../utils/email');
const router = express.Router();

const adminOnly = requireRole('admin');

// GET /api/admin/users
router.get('/users', adminOnly, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, email, name, role, verified, avatar, created_at FROM users ORDER BY created_at DESC
    `).all();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', adminOnly, (req, res) => {
  try {
    const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot delete admin' });
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id/verify
router.put('/users/:id/verify', adminOnly, (req, res) => {
  try {
    const { verified } = req.body;
    db.prepare('UPDATE users SET verified = ? WHERE id = ?').run(verified ? 1 : 0, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/jobs — all jobs
router.get('/jobs', adminOnly, (req, res) => {
  try {
    const jobs = db.prepare(`
      SELECT j.*, u.name as employer_name,
        (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count
      FROM jobs j
      JOIN users u ON j.employer_id = u.id
      ORDER BY j.created_at DESC
    `).all();
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/jobs/:id
router.delete('/jobs/:id', adminOnly, (req, res) => {
  try {
    db.prepare("UPDATE jobs SET status = 'removed' WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/stats
router.get('/stats', adminOnly, (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalSeekers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'seeker'").get().count;
    const totalEmployers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'employer'").get().count;
    const totalJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status != 'removed'").get().count;
    const activeJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'active'").get().count;
    const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
    const pendingApplications = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'pending'").get().count;
    const verifiedUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE verified = 1').get().count;

    res.json({
      stats: { totalUsers, totalSeekers, totalEmployers, totalJobs, activeJobs, totalApplications, pendingApplications, verifiedUsers }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/smtp
router.get('/smtp', adminOnly, (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM smtp_settings WHERE id = 1').get();
    // Don't send password in plain
    if (settings) settings.password = settings.password ? '••••••••' : '';
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/smtp
router.put('/smtp', adminOnly, (req, res) => {
  try {
    const { host, port, username, password, sender_name, sender_email, secure } = req.body;
    const current = db.prepare('SELECT * FROM smtp_settings WHERE id = 1').get();
    db.prepare(`
      UPDATE smtp_settings SET host=?, port=?, username=?, password=?, sender_name=?, sender_email=?, secure=?
      WHERE id = 1
    `).run(
      host || current.host,
      port || current.port,
      username || current.username,
      (password && password !== '••••••••') ? password : current.password,
      sender_name || current.sender_name,
      sender_email || current.sender_email,
      secure !== undefined ? (secure ? 1 : 0) : current.secure
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/smtp/test
router.post('/smtp/test', adminOnly, async (req, res) => {
  try {
    const { test_email } = req.body;
    if (!test_email) return res.status(400).json({ error: 'test_email is required' });

    const result = await sendRawEmail(
      test_email,
      'Workify SMTP Test ✅',
      '<h2>Workify SMTP Test</h2><p>This is a test email. Your SMTP is configured correctly! 🎉</p>'
    );

    if (!result.ok) {
      return res.status(500).json({ error: result.error || 'SMTP test failed' });
    }
    res.json({ ok: true, message: 'Test email sent successfully', previewUrl: result.previewUrl || null });
  } catch (err) {
    res.status(500).json({ error: `SMTP test failed: ${err.message}` });
  }
});



// GET /api/admin/mail/templates
router.get('/mail/templates', adminOnly, (req, res) => {
  const templates = {
    welcome: {
      label: 'Welcome',
      subject: 'Welcome to Workify! 🎉',
      body: `<h2 style="color:#4CAF50">Welcome to Workify! 🎉</h2><p>Hi <strong>{{name}}</strong>,</p><p>We're thrilled to have you on board. Find jobs near you, no resume needed!</p><p><strong>— The Workify Team</strong></p>`,
    },
    verified: {
      label: 'Account Verified',
      subject: '✅ Your Account is Now Verified — Workify',
      body: `<h2 style="color:#4CAF50">🎉 You're Verified!</h2><p>Hi <strong>{{name}}</strong>,</p><p>Your Workify account has been <strong>verified</strong>. You now have a ✓ Verified badge!</p><p><strong>— The Workify Team</strong></p>`,
    },
    job_alert: {
      label: 'Job Alert',
      subject: '💼 New Jobs Available Near You — Workify',
      body: `<h2 style="color:#4CAF50">💼 New Jobs Are Waiting</h2><p>Hi <strong>{{name}}</strong>,</p><p>There are new job openings that match your profile. Act fast!</p><p><a href="{{url}}" style="background:#4CAF50;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">View Jobs →</a></p><p><strong>— The Workify Team</strong></p>`,
    },
    warning: {
      label: 'Warning Notice',
      subject: '⚠️ Important Notice from Workify Admin',
      body: `<h2 style="color:#f59e0b">⚠️ Platform Notice</h2><p>Hi <strong>{{name}}</strong>,</p><blockquote style="border-left:4px solid #f59e0b;padding:12px;background:#fef3c7">{{message}}</blockquote><p><strong>— The Workify Admin Team</strong></p>`,
    },
  };
  res.json({ templates });
});

// POST /api/admin/mail/send
router.post('/mail/send', adminOnly, async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'to, subject, and html are required' });
    }
    const result = await sendRawEmail(to, subject, html);
    if (!result.ok) {
      return res.status(500).json({ error: result.error || 'Failed to send email' });
    }
    res.json({ ok: true, messageId: result.messageId, previewUrl: result.previewUrl || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
