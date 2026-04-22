const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env');
}

// ── Cached connection (critical for Vercel serverless) ─────────────────────
let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = {
      bufferCommands:    false,
      serverSelectionTimeoutMS: 10000,  // 10 s before giving up
      socketTimeoutMS:          45000,
      family: 4,                        // force IPv4 DNS – fixes most ECONNREFUSED on Windows
    };
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then(async (m) => {
        console.log('[MongoDB] Connected');
        await seedDefaults();
        return m;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// ── Seed admin + demo accounts on first run ────────────────────────────────
async function seedDefaults() {
  const User    = require('../models/User');
  const Profile = require('../models/Profile');
  const SmtpSettings = require('../models/SmtpSettings');

  // Default admin
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    const hash = await bcrypt.hash('admin123', 10);
    await User.create({ email: 'admin@workify.com', password: hash, name: 'Admin', role: 'admin', verified: true });
    console.log('[Seed] Default admin created → admin@workify.com / admin123');
  }

  // Demo seeker
  const seekerExists = await User.findOne({ email: 'seeker@workify.com' });
  if (!seekerExists) {
    const hash = await bcrypt.hash('password123', 10);
    const seeker = await User.create({
      email: 'seeker@workify.com', password: hash,
      name: 'Ramesh Kumar', role: 'seeker', verified: true,
    });
    await Profile.create({
      userId: seeker._id,
      skills: 'General Labour, Painting, Loading',
      location: 'Andheri, Mumbai',
      bio: 'Hardworking daily-wage worker with 5 years experience in construction and general labour.',
      languages: 'Hindi, Marathi',
      daily_rate: '₹600/day',
      availability_status: 'available',
      whatsapp: '+919876543210',
    });
    console.log('[Seed] Demo seeker created → seeker@workify.com / password123');
  }

  // Demo employer
  const empExists = await User.findOne({ email: 'employer@workify.com' });
  if (!empExists) {
    const hash = await bcrypt.hash('password123', 10);
    await User.create({ email: 'employer@workify.com', password: hash, name: 'Sharma Constructions', role: 'employer', verified: true });
    console.log('[Seed] Demo employer created → employer@workify.com / password123');
  }

  // SMTP singleton
  const smtpExists = await SmtpSettings.findOne();
  if (!smtpExists) {
    await SmtpSettings.create({});
    console.log('[Seed] SMTP settings document created');
  }
}

module.exports = connectDB;
