const express      = require('express');
const User         = require('../models/User');
const Job          = require('../models/Job');
const Application  = require('../models/Application');
const SmtpSettings = require('../models/SmtpSettings');
const { requireRole } = require('../middleware/auth');
const { sendRawEmail } = require('../utils/email');
const router       = express.Router();

const adminOnly = requireRole('admin');

// GET /api/admin/users
router.get('/users', adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select('id email name role verified avatar_url created_at')
      .sort({ created_at: -1 })
      .lean();
    res.json({ users: users.map(u => ({ ...u, id: u._id.toString() })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('role');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot delete admin' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id/verify
router.put('/users/:id/verify', adminOnly, async (req, res) => {
  try {
    const { verified } = req.body;
    await User.findByIdAndUpdate(req.params.id, { verified: !!verified });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/jobs — all jobs
router.get('/jobs', adminOnly, async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('employer_id', 'name')
      .sort({ created_at: -1 })
      .lean();

    const out = await Promise.all(jobs.map(async j => {
      const count = await Application.countDocuments({ job_id: j._id });
      return {
        ...j,
        id:            j._id.toString(),
        employer_name: j.employer_id?.name,
        employer_id:   j.employer_id?._id?.toString(),
        applicant_count: count,
      };
    }));

    res.json({ jobs: out });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/jobs/:id
router.delete('/jobs/:id', adminOnly, async (req, res) => {
  try {
    await Job.findByIdAndUpdate(req.params.id, { status: 'removed' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/stats
router.get('/stats', adminOnly, async (req, res) => {
  try {
    const [
      totalUsers, totalSeekers, totalEmployers,
      totalJobs, activeJobs,
      totalApplications, pendingApplications, verifiedUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'seeker' }),
      User.countDocuments({ role: 'employer' }),
      Job.countDocuments({ status: { $ne: 'removed' } }),
      Job.countDocuments({ status: 'active' }),
      Application.countDocuments(),
      Application.countDocuments({ status: 'pending' }),
      User.countDocuments({ verified: true }),
    ]);

    res.json({ stats: {
      totalUsers, totalSeekers, totalEmployers,
      totalJobs, activeJobs,
      totalApplications, pendingApplications, verifiedUsers,
    }});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/smtp
router.get('/smtp', adminOnly, async (req, res) => {
  try {
    let settings = await SmtpSettings.findOne().lean();
    if (!settings) settings = await SmtpSettings.create({});
    const out = { ...settings, id: settings._id.toString() };
    if (out.password) out.password = '••••••••';
    res.json({ settings: out });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/smtp
router.put('/smtp', adminOnly, async (req, res) => {
  try {
    const { host, port, username, password, sender_name, sender_email, secure } = req.body;
    const current = await SmtpSettings.findOne() || {};

    const update = {
      host:         host         || current.host         || '',
      port:         port         || current.port         || 587,
      username:     username     || current.username     || '',
      sender_name:  sender_name  || current.sender_name  || 'Workify',
      sender_email: sender_email || current.sender_email || '',
      secure:       secure !== undefined ? !!secure : (current.secure || false),
    };
    // Only update password if a real value is provided
    if (password && password !== '••••••••') {
      update.password = password;
    }

    await SmtpSettings.findOneAndUpdate({}, { $set: update }, { upsert: true });
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

    if (!result.ok) return res.status(500).json({ error: result.error || 'SMTP test failed' });
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
    if (!to || !subject || !html)
      return res.status(400).json({ error: 'to, subject, and html are required' });

    const result = await sendRawEmail(to, subject, html);
    if (!result.ok) return res.status(500).json({ error: result.error || 'Failed to send email' });
    res.json({ ok: true, messageId: result.messageId, previewUrl: result.previewUrl || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
