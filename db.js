const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'workify.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Create tables ──────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('seeker','employer','admin')),
    verified INTEGER DEFAULT 0,
    avatar TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skills TEXT DEFAULT '',
    location TEXT DEFAULT '',
    availability TEXT DEFAULT 'Full-time',
    contact_phone TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    experience TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    skills_required TEXT DEFAULT '',
    duration TEXT DEFAULT '',
    salary TEXT DEFAULT '',
    location TEXT DEFAULT '',
    food_included INTEGER DEFAULT 0,
    transport_included INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','closed','removed')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    seeker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(job_id, seeker_id)
  );

  CREATE TABLE IF NOT EXISTS smtp_settings (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    host TEXT DEFAULT '',
    port INTEGER DEFAULT 587,
    username TEXT DEFAULT '',
    password TEXT DEFAULT '',
    sender_name TEXT DEFAULT 'Workify',
    sender_email TEXT DEFAULT '',
    secure INTEGER DEFAULT 0
  );
`);

// Ensure default admin exists
const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (email, password, name, role, verified) VALUES (?, ?, ?, ?, ?)').run(
    'admin@workify.com', hash, 'Admin', 'admin', 1
  );
}

// Ensure smtp_settings row exists
const smtpExists = db.prepare('SELECT id FROM smtp_settings WHERE id = 1').get();
if (!smtpExists) {
  db.prepare('INSERT INTO smtp_settings (id) VALUES (1)').run();
}

module.exports = db;
