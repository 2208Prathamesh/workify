const express  = require('express');
const multer   = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const User     = require('../models/User');
const Profile  = require('../models/Profile');
const Rating   = require('../models/Rating');
const { requireAuth } = require('../middleware/auth');
const router   = express.Router();

// ── Cloudinary config (reads from env) ────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Multer storage → Cloudinary ────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'workify/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// Gallery uploads also go to Cloudinary
const galleryStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'workify/gallery', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] },
});
const galleryUpload = multer({ storage: galleryStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── GET /api/profile — own profile ────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.session.user.id }).lean();
    const user    = await User.findById(req.session.user.id)
      .select('id email name role avatar_url verified created_at').lean();

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ profile: profile ? { ...profile, ...user, id: user._id.toString() } : { ...user, id: user._id.toString() } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/profile/:id — public profile view ────────────────
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('id name role avatar_url verified created_at').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const profile    = await Profile.findOne({ userId: req.params.id }).lean();
    const ratingAgg  = await Rating.aggregate([
      { $match: { seeker_id: user._id } },
      { $group: { _id: null, avg: { $avg: '$stars' }, count: { $sum: 1 } } },
    ]);
    const ratingData = ratingAgg[0] || { avg: null, count: 0 };

    res.json({
      user:    { ...user, id: user._id.toString() },
      profile: profile || {},
      rating: {
        avg:   ratingData.avg ? parseFloat(ratingData.avg.toFixed(1)) : null,
        count: ratingData.count,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/profile — update own profile ─────────────────────
router.put('/', requireAuth, async (req, res) => {
  try {
    const {
      name, skills, location, availability, contact_phone,
      bio, experience, languages, daily_rate, work_type,
      availability_status, whatsapp, portfolio,
    } = req.body;

    if (name) {
      await User.findByIdAndUpdate(req.session.user.id, { name });
      req.session.user.name = name;
    }

    const isSeeker = req.session.user.role === 'seeker';
    const updateData = isSeeker
      ? {
          skills:              skills || '',
          location:            location || '',
          availability:        availability || 'Full-time',
          contact_phone:       contact_phone || '',
          bio:                 bio || '',
          experience:          experience || '',
          languages:           languages || '',
          daily_rate:          daily_rate || '',
          work_type:           work_type || 'Any',
          availability_status: availability_status || 'looking',
          whatsapp:            whatsapp || '',
          portfolio:           Array.isArray(portfolio) ? portfolio : [],
        }
      : {
          contact_phone: contact_phone || '',
          whatsapp:      whatsapp || '',
          location:      location || '',
        };

    await Profile.findOneAndUpdate(
      { userId: req.session.user.id },
      { $set: updateData },
      { upsert: true, new: true }
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/profile/avatar — upload avatar to Cloudinary ────
router.post('/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = req.file.path; // Cloudinary URL
    await User.findByIdAndUpdate(req.session.user.id, { avatar_url: url });
    req.session.user.avatar_url = url;
    res.json({ ok: true, url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/profile/gallery — upload gallery image ──────────
router.post('/gallery', requireAuth, galleryUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ ok: true, url: req.file.path });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
