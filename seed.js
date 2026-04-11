const db = require('./db');
const bcrypt = require('bcryptjs');

console.log('🌱 Seeding Workify database...\n');

const hash = (pw) => bcrypt.hashSync(pw, 10);

// ── Seekers ───────────────────────────────────────────────────
const seekers = [
  { name: 'Rahul Sharma', email: 'rahul@test.com', skills: 'Painting, Cleaning, Gardening', location: 'Mumbai, MH', availability: 'Full-time', phone: '+91 9876543210', bio: 'Hardworking individual with 3 years of experience in maintenance and household work.' },
  { name: 'Priya Patel', email: 'priya@test.com', skills: 'Cooking, Housekeeping, Childcare', location: 'Delhi, DL', availability: 'Part-time', phone: '+91 9876543211', bio: 'Experienced cook and housekeeper. Available for part-time work in South Delhi.' },
  { name: 'Amit Kumar', email: 'amit@test.com', skills: 'Driving, Delivery, Loading', location: 'Bangalore, KA', availability: 'Full-time', phone: '+91 9876543212', bio: 'Licensed driver with 5 years experience. Can handle deliveries and logistics.' },
  { name: 'Sunita Devi', email: 'sunita@test.com', skills: 'Tailoring, Embroidery, Stitching', location: 'Jaipur, RJ', availability: 'Flexible', phone: '+91 9876543213', bio: 'Skilled tailor specializing in traditional and modern garment stitching.' },
  { name: 'Vikram Singh', email: 'vikram@test.com', skills: 'Plumbing, Electrical, Carpentry', location: 'Pune, MH', availability: 'Full-time', phone: '+91 9876543214', bio: 'Experienced handyman available for all home repair and construction work.' },
  { name: 'Meera Joshi', email: 'meera@test.com', skills: 'Data Entry, Typing, Filing', location: 'Chennai, TN', availability: 'Part-time', phone: '+91 9876543215', bio: 'Computer literate with fast typing skills. Looking for office-based work.' },
  { name: 'Ravi Verma', email: 'ravi@test.com', skills: 'Welding, Fabrication, Metal Work', location: 'Ahmedabad, GJ', availability: 'Full-time', phone: '+91 9876543216', bio: 'Certified welder with experience in industrial and construction projects.' },
];

// ── Employers ─────────────────────────────────────────────────
const employers = [
  { name: 'BuildRight Construction', email: 'buildright@test.com' },
  { name: 'FreshMeals Catering', email: 'freshmeals@test.com' },
  { name: 'QuickShip Logistics', email: 'quickship@test.com' },
  { name: 'GreenWorld Gardens', email: 'greenworld@test.com' },
  { name: 'HomeFix Services', email: 'homefix@test.com' },
];

// Insert seekers
for (const s of seekers) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(s.email);
  if (existing) continue;
  const result = db.prepare('INSERT INTO users (email, password, name, role, verified) VALUES (?, ?, ?, ?, ?)').run(s.email, hash('pass123'), s.name, 'seeker', 1);
  db.prepare('INSERT OR IGNORE INTO profiles (user_id, skills, location, availability, contact_phone, bio) VALUES (?, ?, ?, ?, ?, ?)').run(result.lastInsertRowid, s.skills, s.location, s.availability, s.phone, s.bio);
  console.log(`  ✓ Seeker: ${s.name}`);
}

// Insert employers
const employerIds = [];
for (const e of employers) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(e.email);
  if (existing) { employerIds.push(existing.id); continue; }
  const result = db.prepare('INSERT INTO users (email, password, name, role, verified) VALUES (?, ?, ?, ?, ?)').run(e.email, hash('pass123'), e.name, 'employer', 1);
  employerIds.push(result.lastInsertRowid);
  console.log(`  ✓ Employer: ${e.name}`);
}

// ── Jobs ──────────────────────────────────────────────────────
const jobs = [
  { title: 'Warehouse Packing Assistant', desc: 'Help pack and label shipments in our warehouse. Must be able to lift up to 25kg. Fast-paced environment with supportive team.', skills: 'Packing, Lifting, Organization', duration: '2 weeks', salary: '₹600/day', location: 'Mumbai, MH', food: 1, transport: 0, emp: 0 },
  { title: 'Event Setup Crew', desc: 'We need energetic workers for setting up stages, tents, and decorations for a corporate event. Work starts early morning.', skills: 'Lifting, Setup, Teamwork', duration: '3 days', salary: '₹800/day', location: 'Delhi, DL', food: 1, transport: 1, emp: 0 },
  { title: 'Kitchen Helper — Catering', desc: 'Assist our chefs with food prep, dishwashing, and serving at catering events. Prior kitchen experience preferred.', skills: 'Cooking, Cleaning, Food Prep', duration: '1 week', salary: '₹500/day', location: 'Bangalore, KA', food: 1, transport: 0, emp: 1 },
  { title: 'Delivery Rider (Bike)', desc: 'Deliver food and packages across the city. Must have own bike and valid driving license. Fuel costs reimbursed.', skills: 'Driving, Navigation, Customer Service', duration: '1 month', salary: '₹18,000/month', location: 'Pune, MH', food: 0, transport: 1, emp: 2 },
  { title: 'Garden Maintenance Worker', desc: 'Maintain lawns, plant flowers, trim hedges, and general garden upkeep for residential properties.', skills: 'Gardening, Landscaping, Trimming', duration: 'Ongoing', salary: '₹15,000/month', location: 'Jaipur, RJ', food: 0, transport: 0, emp: 3 },
  { title: 'House Painting — Interior', desc: 'Paint interior walls for a 3BHK apartment. All materials provided. Must bring own brushes and rollers.', skills: 'Painting, Wall Prep, Finishing', duration: '5 days', salary: '₹1,200/day', location: 'Chennai, TN', food: 0, transport: 0, emp: 4 },
  { title: 'Construction Site Helper', desc: 'Assist with brick laying, mixing cement, and material transport at an active construction site. Safety gear provided.', skills: 'Lifting, Construction, Stamina', duration: '3 months', salary: '₹700/day', location: 'Ahmedabad, GJ', food: 1, transport: 1, emp: 0 },
  { title: 'Data Entry Operator', desc: 'Enter sales data into spreadsheets. Must be familiar with MS Excel. Work from our office.', skills: 'Data Entry, Excel, Typing', duration: '2 weeks', salary: '₹12,000/month', location: 'Mumbai, MH', food: 0, transport: 0, emp: 2 },
  { title: 'Plumbing Repair — Residential', desc: 'Fix leaking taps, unclog drains, and install new bathroom fixtures in 4 apartments.', skills: 'Plumbing, Pipe Fitting, Repair', duration: '4 days', salary: '₹1,500/day', location: 'Pune, MH', food: 0, transport: 0, emp: 4 },
  { title: 'Tailoring — Bulk Order', desc: 'Stitch 200 school uniforms (shirts and trousers). Fabric and measurements provided. Deadline is 3 weeks.', skills: 'Tailoring, Stitching, Measurement', duration: '3 weeks', salary: '₹80/piece', location: 'Jaipur, RJ', food: 0, transport: 0, emp: 1 },
];

const existingJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;
if (existingJobs === 0) {
  for (const j of jobs) {
    db.prepare(`
      INSERT INTO jobs (employer_id, title, description, skills_required, duration, salary, location, food_included, transport_included)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(employerIds[j.emp], j.title, j.desc, j.skills, j.duration, j.salary, j.location, j.food, j.transport);
    console.log(`  ✓ Job: ${j.title}`);
  }
}

// ── Sample Applications ────────────────────────────────────────
const seekerIds = db.prepare("SELECT id FROM users WHERE role = 'seeker' ORDER BY id").all().map(r => r.id);
const jobIds = db.prepare("SELECT id FROM jobs WHERE status = 'active' ORDER BY id").all().map(r => r.id);
const existingApps = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;

if (existingApps === 0 && seekerIds.length > 0 && jobIds.length > 0) {
  const sampleApps = [
    { seeker: 0, job: 0, status: 'pending' },
    { seeker: 0, job: 3, status: 'accepted' },
    { seeker: 1, job: 2, status: 'pending' },
    { seeker: 2, job: 3, status: 'accepted' },
    { seeker: 2, job: 6, status: 'pending' },
    { seeker: 3, job: 9, status: 'pending' },
    { seeker: 4, job: 5, status: 'rejected' },
    { seeker: 4, job: 8, status: 'accepted' },
    { seeker: 5, job: 7, status: 'pending' },
    { seeker: 6, job: 6, status: 'pending' },
  ];
  for (const a of sampleApps) {
    if (seekerIds[a.seeker] && jobIds[a.job]) {
      try {
        db.prepare('INSERT INTO applications (seeker_id, job_id, status) VALUES (?, ?, ?)').run(seekerIds[a.seeker], jobIds[a.job], a.status);
      } catch {}
    }
  }
  console.log('  ✓ Sample applications created');
}

console.log('\n✨ Seeding complete!\n');
console.log('Default accounts (password: pass123):');
console.log('  Admin:    admin@workify.com / admin123');
console.log('  Seeker:   rahul@test.com / pass123');
console.log('  Employer: buildright@test.com / pass123');
