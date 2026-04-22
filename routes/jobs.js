const express  = require('express');
const Job      = require('../models/Job');
const SavedJob = require('../models/SavedJob');
const User     = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');
const router   = express.Router();

// ── Helper: serialise Mongoose doc to plain object with employer_name ───────
function _fmt(job, employer) {
  const obj = job.toObject ? job.toObject() : { ...job };
  obj.id = obj._id.toString();
  obj.employer_id = (obj.employer_id?._id || obj.employer_id)?.toString();
  if (employer) obj.employer_name = employer.name;
  return obj;
}

// GET /api/jobs — list active jobs
router.get('/', async (req, res) => {
  try {
    const { search, location, skill } = req.query;
    const filter = { status: 'active' };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (skill)    filter.skills_required = { $regex: skill, $options: 'i' };

    const jobs = await Job.find(filter)
      .populate('employer_id', 'name')
      .sort({ created_at: -1 })
      .lean();

    const out = jobs.map(j => ({
      ...j,
      id: j._id.toString(),
      employer_name: j.employer_id?.name,
      employer_id: j.employer_id?._id?.toString(),
    }));

    res.json({ jobs: out });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/mine — employer's own jobs
router.get('/mine', requireRole('employer'), async (req, res) => {
  try {
    const Application = require('../models/Application');
    const jobs = await Job.find({
      employer_id: req.session.user.id,
      status: { $ne: 'removed' },
    }).sort({ created_at: -1 }).lean();

    const out = await Promise.all(jobs.map(async j => {
      const count = await Application.countDocuments({ job_id: j._id });
      return { ...j, id: j._id.toString(), employer_id: j.employer_id.toString(), applicant_count: count };
    }));

    res.json({ jobs: out });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/saved — seeker's saved jobs
router.get('/saved', requireAuth, async (req, res) => {
  try {
    const saved = await SavedJob.find({ user_id: req.session.user.id })
      .populate({ path: 'job_id', populate: { path: 'employer_id', select: 'name' } })
      .sort({ created_at: -1 })
      .lean();

    const jobs = saved
      .filter(s => s.job_id && s.job_id.status === 'active')
      .map(s => ({
        ...s.job_id,
        id: s.job_id._id.toString(),
        employer_name: s.job_id.employer_id?.name,
        employer_id: s.job_id.employer_id?._id?.toString(),
      }));

    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer_id', 'name')
      .lean();
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({
      job: {
        ...job,
        id: job._id.toString(),
        employer_name: job.employer_id?.name,
        employer_id: job.employer_id?._id?.toString(),
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/jobs — create a job (employer only)
router.post('/', requireRole('employer'), async (req, res) => {
  try {
    const {
      title, description, skills_required, duration, salary, location,
      food_included, transport_included, category, pay_type, urgency, workers_needed
    } = req.body;
    if (!title || !description)
      return res.status(400).json({ error: 'Title and description are required' });

    const job = await Job.create({
      employer_id: req.session.user.id,
      title, description,
      skills_required: skills_required || '',
      duration: duration || '',
      salary: salary || '',
      location: location || '',
      food_included:      !!food_included,
      transport_included: !!transport_included,
      category:      category || 'General',
      pay_type:      pay_type || 'negotiable',
      urgency:       urgency || 'normal',
      workers_needed: workers_needed || 1,
    });

    res.json({ job: { ...job.toObject(), id: job._id.toString() } });

    // --- Notify Seekers Asynchronously ---
    try {
      const seekers = await User.find({ role: 'seeker', email: { $exists: true, $ne: '' } }).lean();
      const appUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
      const jobUrl = `${appUrl}/jobs`;

      seekers.forEach(seeker => {
        sendEmail(
          seeker.email,
          `💼 New Job Posted: ${job.title}`,
          `<h3>Hi ${seeker.name},</h3><p>A new job has been posted that might interest you:</p><p><b>${job.title}</b> in ${job.location || 'your area'}</p><p><a href="${jobUrl}" style="background:#4CAF50;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:10px;">View Jobs →</a></p>`
        ).catch(e => console.error('Email error:', e.message));
      });
    } catch (err) {
      console.error('Failed to send job alerts:', err.message);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/jobs/:id — update a job
router.put('/:id', requireRole('employer'), async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, employer_id: req.session.user.id });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const { title, description, skills_required, duration, salary, location,
            food_included, transport_included, status } = req.body;

    job.title              = title              ?? job.title;
    job.description        = description        ?? job.description;
    job.skills_required    = skills_required    ?? job.skills_required;
    job.duration           = duration           ?? job.duration;
    job.salary             = salary             ?? job.salary;
    job.location           = location           ?? job.location;
    job.food_included      = food_included      !== undefined ? !!food_included      : job.food_included;
    job.transport_included = transport_included !== undefined ? !!transport_included : job.transport_included;
    job.status             = status             ?? job.status;
    await job.save();

    res.json({ job: { ...job.toObject(), id: job._id.toString() } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/jobs/:id — soft delete (status = removed)
router.delete('/:id', requireRole('employer', 'admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (req.session.user.role === 'employer' && job.employer_id.toString() !== req.session.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await Job.findByIdAndUpdate(req.params.id, { status: 'removed' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/:id/applicants — see applicants for a job
router.get('/:id/applicants', requireRole('employer', 'admin'), async (req, res) => {
  try {
    const Application = require('../models/Application');
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (req.session.user.role === 'employer' && job.employer_id.toString() !== req.session.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const apps = await Application.find({ job_id: req.params.id })
      .populate({
        path: 'seeker_id',
        select: 'name email avatar_url verified'
      })
      .sort({ created_at: -1 })
      .lean();

    // Fetch profiles separately for efficiency
    const Profile = require('../models/Profile');
    const applicants = await Promise.all(apps.map(async a => {
      const profile = await Profile.findOne({ userId: a.seeker_id?._id }).lean();
      const app = {
        id:            a._id.toString(),
        status:        a.status,
        created_at:    a.created_at,
        decline_reason: a.decline_reason,
        cancel_reason:  a.cancel_reason,
        user_id:       a.seeker_id?._id?.toString(),
        name:          a.seeker_id?.name,
        email:         a.status === 'accepted' ? a.seeker_id?.email : null,
        avatar_url:    a.seeker_id?.avatar_url,
        verified:      a.seeker_id?.verified,
        skills:             profile?.skills || '',
        location:           profile?.location || '',
        availability:       profile?.availability || '',
        contact_phone:      a.status === 'accepted' ? (profile?.contact_phone || '') : null,
        bio:                profile?.bio || '',
        languages:          profile?.languages || '',
        daily_rate:         profile?.daily_rate || '',
        whatsapp:           a.status === 'accepted' ? (profile?.whatsapp || '') : null,
        availability_status: profile?.availability_status || '',
        portfolio:          profile?.portfolio || [],
      };
      return app;
    }));

    res.json({ applicants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/jobs/:id/save
router.post('/:id/save', requireAuth, async (req, res) => {
  try {
    await SavedJob.findOneAndUpdate(
      { user_id: req.session.user.id, job_id: req.params.id },
      { user_id: req.session.user.id, job_id: req.params.id },
      { upsert: true, new: true }
    );
    res.json({ ok: true, saved: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/jobs/:id/save
router.delete('/:id/save', requireAuth, async (req, res) => {
  try {
    await SavedJob.deleteOne({ user_id: req.session.user.id, job_id: req.params.id });
    res.json({ ok: true, saved: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/:id/saved-status
router.get('/:id/saved-status', requireAuth, async (req, res) => {
  try {
    const row = await SavedJob.findOne({ user_id: req.session.user.id, job_id: req.params.id });
    res.json({ saved: !!row });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
