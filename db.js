const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'workify.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Core tables ────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('seeker','employer','admin')),
    verified INTEGER DEFAULT 0,
    avatar_url TEXT DEFAULT '',
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
    experience TEXT DEFAULT '',
    languages TEXT DEFAULT '',
    daily_rate TEXT DEFAULT '',
    work_type TEXT DEFAULT 'Any',
    availability_status TEXT DEFAULT 'looking',
    whatsapp TEXT DEFAULT '',
    portfolio TEXT DEFAULT '[]'
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
    category TEXT DEFAULT 'General',
    pay_type TEXT DEFAULT 'negotiable',
    urgency TEXT DEFAULT 'normal',
    workers_needed INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    seeker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','withdrawn','cancel_requested','cancelled')),
    decline_reason TEXT DEFAULT '',
    cancel_reason TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(job_id, seeker_id)
  );

  CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seeker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
    review TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(seeker_id, employer_id, job_id)
  );

  CREATE TABLE IF NOT EXISTS saved_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, job_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id  INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
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

// ── Safe column migrations for existing DBs ────────────────────
const migrateColumn = (table, col, def) => {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
    if (!cols.includes(col)) db.prepare(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`).run();
  } catch {}
};

// jobs
migrateColumn('jobs', 'category',       "TEXT DEFAULT 'General'");
migrateColumn('jobs', 'pay_type',       "TEXT DEFAULT 'negotiable'");
migrateColumn('jobs', 'urgency',        "TEXT DEFAULT 'normal'");
migrateColumn('jobs', 'workers_needed', "INTEGER DEFAULT 1");
// profiles
migrateColumn('profiles', 'languages',           "TEXT DEFAULT ''");
migrateColumn('profiles', 'daily_rate',          "TEXT DEFAULT ''");
migrateColumn('profiles', 'work_type',           "TEXT DEFAULT 'Any'");
migrateColumn('profiles', 'availability_status', "TEXT DEFAULT 'looking'");
migrateColumn('profiles', 'whatsapp',            "TEXT DEFAULT ''");
migrateColumn('profiles', 'portfolio',           "TEXT DEFAULT '[]'");
// users
migrateColumn('users', 'avatar_url', "TEXT DEFAULT ''");
migrateColumn('users', 'lang_pref',  "TEXT DEFAULT 'auto'");
// applications
migrateColumn('applications', 'decline_reason', "TEXT DEFAULT ''");
migrateColumn('applications', 'cancel_reason', "TEXT DEFAULT ''");

// Migrate applications table to fix CHECK status constraints
try {
  const tableSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='applications'").get().sql;
  if (!tableSql.includes('withdrawn')) {
    db.exec(`
      PRAGMA foreign_keys = OFF;
      BEGIN TRANSACTION;
      CREATE TABLE applications_new (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
         seeker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
         status TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','withdrawn','cancel_requested','cancelled')),
         decline_reason TEXT DEFAULT '',
         cancel_reason TEXT DEFAULT '',
         created_at TEXT DEFAULT (datetime('now')),
         UNIQUE(job_id, seeker_id)
      );
      INSERT INTO applications_new (id, job_id, seeker_id, status, decline_reason, cancel_reason, created_at)
      SELECT id, job_id, seeker_id, status, decline_reason, cancel_reason, created_at FROM applications;
      DROP TABLE applications;
      ALTER TABLE applications_new RENAME TO applications;
      COMMIT;
      PRAGMA foreign_keys = ON;
    `);
    console.log('[DB] Migrated applications table successfully to update CHECK constraint.');
  }
} catch (err) {
  console.log('[DB] Application table migration error (might be okay if already done):', err.message);
  db.exec('ROLLBACK; PRAGMA foreign_keys = ON;').catch(()=>null);
}

// ── Default admin ──────────────────────────────────────────────
const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (email,password,name,role,verified) VALUES (?,?,?,?,?)').run(
    'admin@workify.com', hash, 'Admin', 'admin', 1
  );
}

// ── Seed demo user accounts if missing ────────────────────────
const seekerExists = db.prepare("SELECT id FROM users WHERE email='seeker@workify.com'").get();
if (!seekerExists) {
  const hash = bcrypt.hashSync('password123', 10);
  const { lastInsertRowid } = db.prepare('INSERT INTO users (email,password,name,role,verified) VALUES (?,?,?,?,?)').run(
    'seeker@workify.com', hash, 'Ramesh Kumar', 'seeker', 1
  );
  db.prepare('INSERT INTO profiles (user_id, skills, location, bio, languages, daily_rate, availability_status, whatsapp) VALUES (?,?,?,?,?,?,?,?)').run(
    lastInsertRowid,
    'General Labour, Painting, Loading',
    'Andheri, Mumbai',
    'Hardworking daily-wage worker with 5 years experience in construction and general labour. Always punctual and reliable.',
    'Hindi, Marathi',
    '₹600/day',
    'available',
    '+919876543210'
  );
}

const empExists = db.prepare("SELECT id FROM users WHERE email='employer@workify.com'").get();
if (!empExists) {
  const hash = bcrypt.hashSync('password123', 10);
  db.prepare('INSERT INTO users (email,password,name,role,verified) VALUES (?,?,?,?,?)').run(
    'employer@workify.com', hash, 'Sharma Constructions', 'employer', 1
  );
}

// ── SMTP row ───────────────────────────────────────────────────
const smtpExists = db.prepare('SELECT id FROM smtp_settings WHERE id = 1').get();
if (!smtpExists) db.prepare('INSERT INTO smtp_settings (id) VALUES (1)').run();

module.exports = db;
