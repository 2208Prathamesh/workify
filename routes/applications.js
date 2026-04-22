const express     = require('express');
const Application = require('../models/Application');
const Job         = require('../models/Job');
const User        = require('../models/User');
const Notification = require('../models/Notification');
const { requireRole } = require('../middleware/auth');
const { sendEmail }   = require('../utils/email');
const router = express.Router();

// POST /api/applications — seeker applies to a job
router.post('/', requireRole('seeker'), async (req, res) => {
  try {
    const { job_id } = req.body;
    if (!job_id) return res.status(400).json({ error: 'job_id is required' });

    const job = await Job.findOne({ _id: job_id, status: 'active' });
    if (!job) return res.status(404).json({ error: 'Job not found or not active' });

    const existing = await Application.findOne({ job_id, seeker_id: req.session.user.id });
    if (existing) return res.status(409).json({ error: 'Already applied' });

    await Application.create({ job_id, seeker_id: req.session.user.id });

    // Notify employer
    await Notification.create({
      user_id: job.employer_id,
      type: 'application',
      message: `New applicant for: ${job.title}`,
      link: `/applicants/${job._id}`,
    });

    const employer = await User.findById(job.employer_id).select('email name');
    if (employer?.email) {
      sendEmail(employer.email, `New Application for ${job.title}`,
        `<h3>Hi ${employer.name},</h3><p>You have received a new application for your job posting: <b>${job.title}</b>.</p><p>Login to your Workify dashboard to review the applicant.</p>`
      );
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/applications — seeker views their applications
router.get('/', requireRole('seeker'), async (req, res) => {
  try {
    const apps = await Application.find({ seeker_id: req.session.user.id })
      .populate({
        path: 'job_id',
        select: 'title salary location duration status employer_id',
        populate: { path: 'employer_id', select: 'name email' },
      })
      .sort({ created_at: -1 })
      .lean();

    const Profile = require('../models/Profile');
    const applications = await Promise.all(apps.map(async a => {
      const empProfile = a.job_id?.employer_id?._id
        ? await Profile.findOne({ userId: a.job_id.employer_id._id }).select('contact_phone whatsapp').lean()
        : null;
      return {
        id:               a._id.toString(),
        status:           a.status,
        created_at:       a.created_at,
        decline_reason:   a.decline_reason,
        cancel_reason:    a.cancel_reason,
        job_title:        a.job_id?.title,
        salary:           a.job_id?.salary,
        job_location:     a.job_id?.location,
        duration:         a.job_id?.duration,
        job_status:       a.job_id?.status,
        employer_name:    a.job_id?.employer_id?.name,
        employer_email:   a.job_id?.employer_id?.email,
        employer_phone:   empProfile?.contact_phone || '',
        employer_whatsapp: empProfile?.whatsapp || '',
      };
    }));

    res.json({ applications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/applications/:id — employer accepts/rejects
router.put('/:id', requireRole('employer'), async (req, res) => {
  try {
    const { status, decline_reason } = req.body;
    if (!['accepted', 'rejected'].includes(status))
      return res.status(400).json({ error: 'Status must be accepted or rejected' });

    const app = await Application.findById(req.params.id).populate('job_id');
    if (!app) return res.status(404).json({ error: 'Application not found' });
    if (app.job_id.employer_id.toString() !== req.session.user.id)
      return res.status(403).json({ error: 'Forbidden' });

    app.status = status;
    if (status === 'rejected') app.decline_reason = decline_reason || '';
    await app.save();

    const seeker = await User.findById(app.seeker_id).select('email name');
    const job    = app.job_id;

    await Notification.create({
      user_id: app.seeker_id,
      type: 'status',
      message: `Application ${status}: ${job.title}`,
      link: '/applications',
    });

    if (seeker?.email) {
      if (status === 'accepted') {
        sendEmail(seeker.email, `Application Accepted: ${job.title}`,
          `<h3>Congratulations ${seeker.name}!</h3><p>Your application for <b>${job.title}</b> has been accepted by the employer.</p>`);
      } else {
        sendEmail(seeker.email, `Application Update: ${job.title}`,
          `<h3>Hi ${seeker.name},</h3><p>Your application for <b>${job.title}</b> was reviewed but unfortunately not accepted at this time.</p>`);
      }
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/applications/:id — seeker withdraws pending application
router.delete('/:id', requireRole('seeker'), async (req, res) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, seeker_id: req.session.user.id });
    if (!app) return res.status(404).json({ error: 'Application not found' });
    if (app.status !== 'pending')
      return res.status(400).json({ error: 'Only pending applications can be withdrawn without approval' });

    await Application.findByIdAndUpdate(req.params.id, { status: 'withdrawn' });
    res.json({ ok: true, withdrawn: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/applications/:id/cancel — seeker requests cancel for accepted job
router.post('/:id/cancel', requireRole('seeker'), async (req, res) => {
  try {
    const { cancel_reason } = req.body;
    if (!cancel_reason?.trim()) return res.status(400).json({ error: 'Reason for cancellation required' });

    const app = await Application.findOne({ _id: req.params.id, seeker_id: req.session.user.id }).populate('job_id');
    if (!app) return res.status(404).json({ error: 'Application not found' });
    if (app.status !== 'accepted') return res.status(400).json({ error: 'Can only request cancel for accepted jobs' });

    app.status        = 'cancel_requested';
    app.cancel_reason = cancel_reason;
    await app.save();

    const job = app.job_id;
    if (job) {
      await Notification.create({
        user_id: job.employer_id,
        type: 'alert',
        message: `Worker cancellation requested: ${job.title}`,
        link: `/applicants/${job._id}`,
      });
      const employer = await User.findById(job.employer_id).select('email name');
      if (employer?.email) {
        sendEmail(employer.email, `Worker Cancelled: ${job.title}`,
          `<h3>Hi ${employer.name},</h3><p>A worker has requested to cancel their assignment for <b>${job.title}</b>.</p><p>Reason: ${cancel_reason}</p><p>Please approve this cancellation in your dashboard.</p>`);
      }
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/applications/:id/approve-cancel — employer approves seeker's cancel request
router.put('/:id/approve-cancel', requireRole('employer'), async (req, res) => {
  try {
    const app = await Application.findById(req.params.id).populate('job_id');
    if (!app) return res.status(404).json({ error: 'Application not found' });
    if (app.job_id.employer_id.toString() !== req.session.user.id)
      return res.status(403).json({ error: 'Forbidden' });
    if (app.status !== 'cancel_requested')
      return res.status(400).json({ error: 'No cancellation requested' });

    await Application.findByIdAndUpdate(req.params.id, { status: 'cancelled' });

    const seeker = await User.findById(app.seeker_id).select('email name');
    const job    = app.job_id;

    await Notification.create({
      user_id: app.seeker_id,
      type: 'alert',
      message: `Cancellation approved: ${job.title}`,
      link: '/applications',
    });

    if (seeker?.email) {
      sendEmail(seeker.email, `Cancellation Approved: ${job.title}`,
        `<h3>Hi ${seeker.name},</h3><p>Your cancellation request for <b>${job.title}</b> has been approved by the employer.</p>`);
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
