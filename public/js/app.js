/* ═══════════════════════════════════════════════════════════════
   WORKIFY — Single Page Application
   ═══════════════════════════════════════════════════════════════ */

// ── State ──────────────────────────────────────────────────────
let currentUser = null;
let currentPage = '';

// ── API Helpers ────────────────────────────────────────────────
async function api(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

// ── Toast Notifications ───────────────────────────────────────
function toast(msg, type = 'info') {
  const c = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'} ${msg}`;
  c.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ── Theme Toggle ──────────────────────────────────────────────
function getTheme() {
  return localStorage.getItem('workify-theme') || 'light';
}
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('workify-theme', t);
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
}
function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

// ── Mobile Nav ────────────────────────────────────────────────
function toggleMobileNav() {
  document.getElementById('navLinks').classList.toggle('open');
}

// ── Navigation / Router ───────────────────────────────────────
function navigate(hash) {
  window.location.hash = hash;
  document.getElementById('navLinks').classList.remove('open');
}

function getHash() {
  return window.location.hash.replace('#', '') || '/';
}

async function router() {
  const hash = getHash();
  if (hash === currentPage) return;
  currentPage = hash;

  // Check auth
  if (!currentUser) {
    try {
      const data = await api('/api/auth/me');
      currentUser = data.user;
    } catch { currentUser = null; }
  }

  renderNav();
  const app = document.getElementById('app');
  app.classList.remove('page-enter');
  void app.offsetWidth; // reflow
  app.classList.add('page-enter');

  // Route mapping
  switch (hash) {
    case '/': return renderLanding();
    case '/login': return renderLogin();
    case '/signup': return renderSignup();
    case '/dashboard': return requireAuth() && renderDashboard();
    case '/jobs': return requireAuth() && renderJobFeed();
    case '/post-job': return requireAuth() && requireRole('employer') && renderPostJob();
    case '/my-jobs': return requireAuth() && requireRole('employer') && renderMyJobs();
    case '/applications': return requireAuth() && requireRole('seeker') && renderMyApplications();
    case '/profile': return requireAuth() && renderProfile();
    case '/admin': return requireAuth() && requireRole('admin') && renderAdmin();
    default:
      if (hash.startsWith('/job/')) return requireAuth() && renderJobDetail(hash.split('/job/')[1]);
      if (hash.startsWith('/applicants/')) return requireAuth() && requireRole('employer') && renderApplicants(hash.split('/applicants/')[1]);
      return renderNotFound();
  }
}

function requireAuth() {
  if (!currentUser) { navigate('/login'); return false; }
  return true;
}
function requireRole(role) {
  if (currentUser.role !== role) { navigate('/dashboard'); return false; }
  return true;
}

// ── Render Navigation ─────────────────────────────────────────
function renderNav() {
  const nav = document.getElementById('navLinks');
  const hash = getHash();

  if (!currentUser) {
    nav.innerHTML = `
      <li><a href="#/login" class="${hash==='/login'?'active':''}" onclick="navigate('/login');return false">Log In</a></li>
      <li><a href="#/signup" class="btn btn-primary btn-sm" onclick="navigate('/signup');return false">Sign Up Free</a></li>
      <li><button class="theme-toggle" id="themeBtn" onclick="toggleTheme()">${getTheme()==='dark'?'☀️':'🌙'}</button></li>
    `;
  } else {
    let links = '';
    if (currentUser.role === 'seeker') {
      links = `
        <li><a href="#/dashboard" class="${hash==='/dashboard'?'active':''}" onclick="navigate('/dashboard');return false">📊 Dashboard</a></li>
        <li><a href="#/jobs" class="${hash==='/jobs'?'active':''}" onclick="navigate('/jobs');return false">💼 Jobs</a></li>
        <li><a href="#/applications" class="${hash==='/applications'?'active':''}" onclick="navigate('/applications');return false">📋 Applications</a></li>
        <li><a href="#/profile" class="${hash==='/profile'?'active':''}" onclick="navigate('/profile');return false">👤 Profile</a></li>
      `;
    } else if (currentUser.role === 'employer') {
      links = `
        <li><a href="#/dashboard" class="${hash==='/dashboard'?'active':''}" onclick="navigate('/dashboard');return false">📊 Dashboard</a></li>
        <li><a href="#/post-job" class="${hash==='/post-job'?'active':''}" onclick="navigate('/post-job');return false">➕ Post Job</a></li>
        <li><a href="#/my-jobs" class="${hash==='/my-jobs'?'active':''}" onclick="navigate('/my-jobs');return false">📋 My Jobs</a></li>
        <li><a href="#/profile" class="${hash==='/profile'?'active':''}" onclick="navigate('/profile');return false">👤 Profile</a></li>
      `;
    } else if (currentUser.role === 'admin') {
      links = `
        <li><a href="#/dashboard" class="${hash==='/dashboard'?'active':''}" onclick="navigate('/dashboard');return false">📊 Dashboard</a></li>
        <li><a href="#/admin" class="${hash==='/admin'?'active':''}" onclick="navigate('/admin');return false">⚙️ Admin</a></li>
      `;
    }
    nav.innerHTML = `
      ${links}
      <li><button class="theme-toggle" id="themeBtn" onclick="toggleTheme()">${getTheme()==='dark'?'☀️':'🌙'}</button></li>
      <li><button class="btn btn-ghost btn-sm" onclick="logout()">Logout</button></li>
    `;
  }
}

async function logout() {
  await api('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  toast('Logged out successfully', 'success');
  navigate('/');
}

// ═══════════════════════════════════════════════════════════════
// PAGES
// ═══════════════════════════════════════════════════════════════

// ── Landing Page ──────────────────────────────────────────────
function renderLanding() {
  if (currentUser) return navigate('/dashboard');
  document.getElementById('app').innerHTML = `
    <section class="hero">
      <div class="hero-badge">🚀 The Future of Hiring</div>
      <h1>Find Work.<br><span class="gradient-text">Find Workers.</span></h1>
      <p>Workify connects unemployed workers, freelancers, and employers looking for short-term, skill-based talent. Simple, fast, and fair.</p>
      <div class="hero-actions">
        <button class="btn btn-primary btn-lg" onclick="navigate('/signup')">Get Started Free →</button>
        <button class="btn btn-outline btn-lg" onclick="navigate('/login')">Log In</button>
      </div>
      <div class="hero-stats">
        <div class="hero-stat">
          <div class="stat-value" id="heroJobs">0</div>
          <div class="stat-label">Active Jobs</div>
        </div>
        <div class="hero-stat">
          <div class="stat-value" id="heroWorkers">0</div>
          <div class="stat-label">Workers</div>
        </div>
        <div class="hero-stat">
          <div class="stat-value" id="heroEmployers">0</div>
          <div class="stat-label">Employers</div>
        </div>
      </div>
    </section>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon blue">🔍</div>
        <h3>Discover Jobs</h3>
        <p>Browse a curated feed of short-term and skill-based job opportunities in your area.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon red">📝</div>
        <h3>Easy Applications</h3>
        <p>One-click applications. Show your interest instantly and track your application status.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon teal">🤝</div>
        <h3>Hire Instantly</h3>
        <p>Post jobs, review applicants, and accept the best candidates — all from one dashboard.</p>
      </div>
    </div>
    <div class="footer">
      <p>© 2026 Workify — Work for Everyone. All rights reserved.</p>
    </div>
  `;
  // Load quick stats
  loadLandingStats();
}

async function loadLandingStats() {
  try {
    const data = await api('/api/jobs');
    document.getElementById('heroJobs').textContent = data.jobs.length;
  } catch {}
}

// ── Login Page ────────────────────────────────────────────────
function renderLogin() {
  if (currentUser) return navigate('/dashboard');
  document.getElementById('app').innerHTML = `
    <div class="auth-page">
      <div class="auth-card glass-card">
        <h2>Welcome Back</h2>
        <p class="auth-subtitle">Log in to your Workify account</p>
        <form id="loginForm" onsubmit="handleLogin(event)">
          <div class="form-group">
            <label for="loginEmail">Email Address</label>
            <input type="email" id="loginEmail" class="form-input" placeholder="you@example.com" required>
          </div>
          <div class="form-group">
            <label for="loginPassword">Password</label>
            <input type="password" id="loginPassword" class="form-input" placeholder="Enter your password" required>
          </div>
          <button type="submit" class="btn btn-primary btn-block btn-lg" id="loginBtn">Log In</button>
        </form>
        <div class="auth-footer">
          Don't have an account? <a href="#/signup" onclick="navigate('/signup');return false">Sign up free</a>
        </div>
      </div>
    </div>
  `;
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  btn.disabled = true; btn.textContent = 'Logging in...';
  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
      }
    });
    currentUser = data.user;
    toast('Welcome back, ' + currentUser.name + '!', 'success');
    navigate('/dashboard');
  } catch (err) {
    toast(err.message, 'error');
    btn.disabled = false; btn.textContent = 'Log In';
  }
}

// ── Signup Page ───────────────────────────────────────────────
function renderSignup() {
  if (currentUser) return navigate('/dashboard');
  document.getElementById('app').innerHTML = `
    <div class="auth-page">
      <div class="auth-card glass-card">
        <h2>Create Account</h2>
        <p class="auth-subtitle">Join Workify and start your journey</p>
        <form id="signupForm" onsubmit="handleSignup(event)">
          <div class="form-group">
            <label for="signupName">Full Name</label>
            <input type="text" id="signupName" class="form-input" placeholder="John Doe" required>
          </div>
          <div class="form-group">
            <label for="signupEmail">Email Address</label>
            <input type="email" id="signupEmail" class="form-input" placeholder="you@example.com" required>
          </div>
          <div class="form-group">
            <label for="signupPassword">Password</label>
            <input type="password" id="signupPassword" class="form-input" placeholder="Min. 6 characters" required minlength="6">
          </div>
          <div class="form-group">
            <label>I want to</label>
            <div class="role-selector" id="roleSelector">
              <div class="role-option" onclick="selectRole('seeker', this)">
                <div class="role-icon">🔍</div>
                <div class="role-name">Find Work</div>
                <div class="role-desc">Job Seeker</div>
              </div>
              <div class="role-option" onclick="selectRole('employer', this)">
                <div class="role-icon">🏢</div>
                <div class="role-name">Hire Workers</div>
                <div class="role-desc">Employer</div>
              </div>
            </div>
            <input type="hidden" id="signupRole" required>
          </div>
          <button type="submit" class="btn btn-primary btn-block btn-lg" id="signupBtn">Create Account</button>
        </form>
        <div class="auth-footer">
          Already have an account? <a href="#/login" onclick="navigate('/login');return false">Log in</a>
        </div>
      </div>
    </div>
  `;
}

function selectRole(role, el) {
  document.querySelectorAll('.role-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('signupRole').value = role;
}

async function handleSignup(e) {
  e.preventDefault();
  const role = document.getElementById('signupRole').value;
  if (!role) { toast('Please select a role', 'error'); return; }
  const btn = document.getElementById('signupBtn');
  btn.disabled = true; btn.textContent = 'Creating account...';
  try {
    const data = await api('/api/auth/signup', {
      method: 'POST',
      body: {
        name: document.getElementById('signupName').value,
        email: document.getElementById('signupEmail').value,
        password: document.getElementById('signupPassword').value,
        role
      }
    });
    currentUser = data.user;
    toast('Account created! Welcome to Workify!', 'success');
    navigate('/dashboard');
  } catch (err) {
    toast(err.message, 'error');
    btn.disabled = false; btn.textContent = 'Create Account';
  }
}

// ── Dashboard ─────────────────────────────────────────────────
async function renderDashboard() {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="container"><div class="loading-spinner"><div class="spinner"></div></div></div>`;

  if (currentUser.role === 'seeker') await renderSeekerDashboard();
  else if (currentUser.role === 'employer') await renderEmployerDashboard();
  else if (currentUser.role === 'admin') await renderAdminDashboard();
}

async function renderSeekerDashboard() {
  let apps = [], jobs = [];
  try {
    const [appData, jobData] = await Promise.all([
      api('/api/applications'),
      api('/api/jobs')
    ]);
    apps = appData.applications;
    jobs = jobData.jobs;
  } catch {}

  const pending = apps.filter(a => a.status === 'pending').length;
  const accepted = apps.filter(a => a.status === 'accepted').length;

  document.getElementById('app').innerHTML = `
    <div class="container">
      <div class="dashboard-header">
        <h1>Welcome, ${esc(currentUser.name)} 👋</h1>
        <p>Here's your job seeking overview</p>
      </div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">💼</div>
          <div class="stat-number">${jobs.length}</div>
          <div class="stat-label">Available Jobs</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon teal">📋</div>
          <div class="stat-number">${apps.length}</div>
          <div class="stat-label">My Applications</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon gray">⏳</div>
          <div class="stat-number">${pending}</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">✅</div>
          <div class="stat-number">${accepted}</div>
          <div class="stat-label">Accepted</div>
        </div>
      </div>
      <div class="quick-actions">
        <button class="btn btn-primary" onclick="navigate('/jobs')">🔍 Browse Jobs</button>
        <button class="btn btn-outline" onclick="navigate('/applications')">📋 My Applications</button>
        <button class="btn btn-outline" onclick="navigate('/profile')">👤 Edit Profile</button>
      </div>
      <div class="section-title"><h2>Latest Jobs</h2></div>
      <div class="jobs-grid">
        ${jobs.slice(0, 6).map(j => jobCard(j)).join('')}
        ${jobs.length === 0 ? emptyState('No jobs available yet', 'Check back soon for new opportunities!') : ''}
      </div>
    </div>
  `;
}

async function renderEmployerDashboard() {
  let jobs = [];
  try {
    const data = await api('/api/jobs/mine');
    jobs = data.jobs;
  } catch {}

  const activeCount = jobs.filter(j => j.status === 'active').length;
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicant_count || 0), 0);

  document.getElementById('app').innerHTML = `
    <div class="container">
      <div class="dashboard-header">
        <h1>Welcome, ${esc(currentUser.name)} 👋</h1>
        <p>Manage your job postings and candidates</p>
      </div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">📄</div>
          <div class="stat-number">${jobs.length}</div>
          <div class="stat-label">Total Postings</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon teal">✅</div>
          <div class="stat-number">${activeCount}</div>
          <div class="stat-label">Active Jobs</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">👥</div>
          <div class="stat-number">${totalApplicants}</div>
          <div class="stat-label">Total Applicants</div>
        </div>
      </div>
      <div class="quick-actions">
        <button class="btn btn-primary" onclick="navigate('/post-job')">➕ Post New Job</button>
        <button class="btn btn-outline" onclick="navigate('/my-jobs')">📋 Manage Jobs</button>
      </div>
      <div class="section-title"><h2>Recent Postings</h2></div>
      ${jobs.length > 0 ? `
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>Title</th><th>Location</th><th>Salary</th><th>Applicants</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${jobs.slice(0, 5).map(j => `
                <tr>
                  <td><strong>${esc(j.title)}</strong></td>
                  <td>${esc(j.location) || '—'}</td>
                  <td>${esc(j.salary) || '—'}</td>
                  <td><strong>${j.applicant_count || 0}</strong></td>
                  <td><span class="badge badge-${j.status}">${j.status}</span></td>
                  <td><button class="btn btn-sm btn-ghost" onclick="navigate('/applicants/${j.id}')">View</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : emptyState('No job postings yet', 'Create your first job posting to start hiring!')}
    </div>
  `;
}

async function renderAdminDashboard() {
  let stats = {};
  try {
    const data = await api('/api/admin/stats');
    stats = data.stats;
  } catch {}

  document.getElementById('app').innerHTML = `
    <div class="container">
      <div class="dashboard-header">
        <h1>Admin Dashboard 🛡️</h1>
        <p>Platform overview and management</p>
      </div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">👥</div>
          <div class="stat-number">${stats.totalUsers || 0}</div>
          <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon teal">🔍</div>
          <div class="stat-number">${stats.totalSeekers || 0}</div>
          <div class="stat-label">Job Seekers</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon gray">🏢</div>
          <div class="stat-number">${stats.totalEmployers || 0}</div>
          <div class="stat-label">Employers</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">💼</div>
          <div class="stat-number">${stats.activeJobs || 0}</div>
          <div class="stat-label">Active Jobs</div>
        </div>
      </div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">📋</div>
          <div class="stat-number">${stats.totalApplications || 0}</div>
          <div class="stat-label">Applications</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon gray">⏳</div>
          <div class="stat-number">${stats.pendingApplications || 0}</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon teal">✓</div>
          <div class="stat-number">${stats.verifiedUsers || 0}</div>
          <div class="stat-label">Verified Users</div>
        </div>
      </div>
      <div class="quick-actions">
        <button class="btn btn-primary" onclick="navigate('/admin')">⚙️ Go to Admin Panel</button>
      </div>
    </div>
  `;
}

// ── Job Feed ──────────────────────────────────────────────────
async function renderJobFeed() {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="container"><div class="loading-spinner"><div class="spinner"></div></div></div>`;

  let jobs = [];
  try {
    const data = await api('/api/jobs');
    jobs = data.jobs;
  } catch {}

  // Get user's existing applications to show status
  let myApps = [];
  if (currentUser.role === 'seeker') {
    try {
      const data = await api('/api/applications');
      myApps = data.applications.map(a => a.job_id);
    } catch {}
  }

  app.innerHTML = `
    <div class="container">
      <div class="jobs-header">
        <h2>💼 Job Feed</h2>
        <span class="text-muted">${jobs.length} jobs available</span>
      </div>
      <div class="search-bar">
        <input type="text" class="form-input" id="searchInput" placeholder="🔍 Search jobs..." oninput="filterJobs()">
        <input type="text" class="form-input" id="locationInput" placeholder="📍 Location..." oninput="filterJobs()" style="max-width:200px">
      </div>
      <div class="jobs-grid" id="jobsGrid">
        ${jobs.map(j => jobCard(j, myApps.includes(j.id))).join('')}
        ${jobs.length === 0 ? emptyState('No jobs found', 'Try adjusting your search or check back later.') : ''}
      </div>
    </div>
  `;

  // Store jobs for filtering
  window._feedJobs = jobs;
  window._myApps = myApps;
}

function filterJobs() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const loc = document.getElementById('locationInput').value.toLowerCase();
  const filtered = (window._feedJobs || []).filter(j => {
    const matchSearch = !search || j.title.toLowerCase().includes(search) || j.description.toLowerCase().includes(search) || j.skills_required.toLowerCase().includes(search);
    const matchLoc = !loc || j.location.toLowerCase().includes(loc);
    return matchSearch && matchLoc;
  });
  document.getElementById('jobsGrid').innerHTML = filtered.map(j => jobCard(j, (window._myApps || []).includes(j.id))).join('') || emptyState('No matching jobs', 'Try a different search term.');
}

// ── Job Card Component ────────────────────────────────────────
function jobCard(job, applied = false) {
  const skills = job.skills_required ? job.skills_required.split(',').map(s => s.trim()).filter(Boolean) : [];
  const perks = [];
  if (job.food_included) perks.push('🍽️ Food');
  if (job.transport_included) perks.push('🚗 Transport');

  return `
    <div class="job-card">
      <div class="job-card-header">
        <h3>${esc(job.title)}</h3>
        ${job.salary ? `<span class="job-salary">${esc(job.salary)}</span>` : ''}
      </div>
      <div class="job-employer">🏢 ${esc(job.employer_name || 'Employer')}</div>
      <div class="job-description">${esc(job.description)}</div>
      <div class="job-meta">
        ${job.location ? `<span class="job-tag location">📍 ${esc(job.location)}</span>` : ''}
        ${job.duration ? `<span class="job-tag duration">⏱️ ${esc(job.duration)}</span>` : ''}
        ${perks.map(p => `<span class="job-tag perk">${p}</span>`).join('')}
      </div>
      ${skills.length > 0 ? `
        <div class="job-skills">
          ${skills.map(s => `<span class="skill-chip">${esc(s)}</span>`).join('')}
        </div>
      ` : ''}
      <div class="job-card-footer">
        <span class="job-time">${timeAgo(job.created_at)}</span>
        ${currentUser && currentUser.role === 'seeker' ? `
          ${applied
            ? `<span class="badge badge-pending">Applied ✓</span>`
            : `<button class="btn btn-primary btn-sm" onclick="applyJob(${job.id}, this)">I'm Interested</button>`
          }
        ` : ''}
      </div>
    </div>
  `;
}

async function applyJob(jobId, btn) {
  btn.disabled = true; btn.textContent = 'Applying...';
  try {
    await api('/api/applications', { method: 'POST', body: { job_id: jobId } });
    btn.outerHTML = `<span class="badge badge-pending">Applied ✓</span>`;
    toast('Application submitted!', 'success');
  } catch (err) {
    toast(err.message, 'error');
    btn.disabled = false; btn.textContent = "I'm Interested";
  }
}

// ── Post Job ──────────────────────────────────────────────────
function renderPostJob() {
  document.getElementById('app').innerHTML = `
    <div class="container-narrow">
      <div class="glass-card" style="padding:36px">
        <h2 style="margin-bottom:4px">➕ Post a New Job</h2>
        <p class="text-muted mb-3">Fill in the details to find the right workers</p>
        <form onsubmit="handlePostJob(event)">
          <div class="form-group">
            <label for="jobTitle">Job Title *</label>
            <input type="text" id="jobTitle" class="form-input" placeholder="e.g., Warehouse Helper" required>
          </div>
          <div class="form-group">
            <label for="jobDesc">Description *</label>
            <textarea id="jobDesc" class="form-textarea" placeholder="Describe the job, requirements, and what workers will do..." required></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="jobSalary">Salary / Pay</label>
              <input type="text" id="jobSalary" class="form-input" placeholder="e.g., ₹500/day">
            </div>
            <div class="form-group">
              <label for="jobDuration">Duration</label>
              <input type="text" id="jobDuration" class="form-input" placeholder="e.g., 2 weeks">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="jobLocation">Location</label>
              <input type="text" id="jobLocation" class="form-input" placeholder="e.g., Mumbai, MH">
            </div>
            <div class="form-group">
              <label for="jobSkills">Skills Required</label>
              <input type="text" id="jobSkills" class="form-input" placeholder="e.g., Lifting, Packing">
              <div class="hint">Comma-separated</div>
            </div>
          </div>
          <div class="form-row mb-3">
            <label class="form-check">
              <input type="checkbox" id="jobFood"> Food Included
            </label>
            <label class="form-check">
              <input type="checkbox" id="jobTransport"> Transport Included
            </label>
          </div>
          <button type="submit" class="btn btn-primary btn-block btn-lg" id="postJobBtn">Post Job</button>
        </form>
      </div>
    </div>
  `;
}

async function handlePostJob(e) {
  e.preventDefault();
  const btn = document.getElementById('postJobBtn');
  btn.disabled = true; btn.textContent = 'Posting...';
  try {
    await api('/api/jobs', {
      method: 'POST',
      body: {
        title: document.getElementById('jobTitle').value,
        description: document.getElementById('jobDesc').value,
        salary: document.getElementById('jobSalary').value,
        duration: document.getElementById('jobDuration').value,
        location: document.getElementById('jobLocation').value,
        skills_required: document.getElementById('jobSkills').value,
        food_included: document.getElementById('jobFood').checked,
        transport_included: document.getElementById('jobTransport').checked
      }
    });
    toast('Job posted successfully!', 'success');
    navigate('/my-jobs');
  } catch (err) {
    toast(err.message, 'error');
    btn.disabled = false; btn.textContent = 'Post Job';
  }
}

// ── My Jobs (Employer) ───────────────────────────────────────
async function renderMyJobs() {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="container"><div class="loading-spinner"><div class="spinner"></div></div></div>`;

  let jobs = [];
  try { jobs = (await api('/api/jobs/mine')).jobs; } catch {}

  app.innerHTML = `
    <div class="container">
      <div class="jobs-header">
        <h2>📋 My Job Postings</h2>
        <button class="btn btn-primary" onclick="navigate('/post-job')">➕ Post New</button>
      </div>
      ${jobs.length > 0 ? `
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>Title</th><th>Location</th><th>Salary</th><th>Duration</th><th>Applicants</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${jobs.map(j => `
                <tr>
                  <td><strong>${esc(j.title)}</strong></td>
                  <td>${esc(j.location) || '—'}</td>
                  <td>${esc(j.salary) || '—'}</td>
                  <td>${esc(j.duration) || '—'}</td>
                  <td><strong>${j.applicant_count || 0}</strong></td>
                  <td><span class="badge badge-${j.status}">${j.status}</span></td>
                  <td>
                    <div class="flex gap-1">
                      <button class="btn btn-sm btn-ghost" onclick="navigate('/applicants/${j.id}')" title="View Applicants">👥</button>
                      ${j.status === 'active' ? `<button class="btn btn-sm btn-danger" onclick="closeJob(${j.id})" title="Close Job">✕</button>` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : emptyState('No job postings yet', 'Create your first job posting to start hiring!')}
    </div>
  `;
}

async function closeJob(id) {
  if (!confirm('Close this job posting?')) return;
  try {
    await api(`/api/jobs/${id}`, { method: 'PUT', body: { status: 'closed' } });
    toast('Job closed', 'success');
    renderMyJobs();
  } catch (err) { toast(err.message, 'error'); }
}

// ── Applicants ────────────────────────────────────────────────
async function renderApplicants(jobId) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="container"><div class="loading-spinner"><div class="spinner"></div></div></div>`;

  let job = null, applicants = [];
  try {
    [job, applicants] = await Promise.all([
      api(`/api/jobs/${jobId}`).then(d => d.job),
      api(`/api/jobs/${jobId}/applicants`).then(d => d.applicants)
    ]);
  } catch {}

  app.innerHTML = `
    <div class="container">
      <button class="btn btn-ghost mb-2" onclick="navigate('/my-jobs')">← Back to My Jobs</button>
      <div class="glass-card" style="padding:24px;margin-bottom:24px">
        <h2>${job ? esc(job.title) : 'Job'}</h2>
        <p class="text-muted">${applicants.length} applicant(s)</p>
      </div>
      <div id="applicantsList">
        ${applicants.length > 0 ? applicants.map(a => `
          <div class="applicant-card" id="app-${a.id}">
            <div class="applicant-avatar">${esc(a.name[0])}</div>
            <div class="applicant-info">
              <h4>${esc(a.name)} <span class="badge badge-${a.status}" style="margin-left:8px">${a.status}</span></h4>
              <p>${esc(a.email)} ${a.contact_phone ? '· ' + esc(a.contact_phone) : ''}</p>
              ${a.skills ? `<p style="margin-top:4px">Skills: ${esc(a.skills)}</p>` : ''}
              ${a.location ? `<p>📍 ${esc(a.location)}</p>` : ''}
            </div>
            ${a.status === 'pending' ? `
              <div class="applicant-actions">
                <button class="btn btn-sm btn-success" onclick="updateApplication(${a.id}, 'accepted')">✓ Accept</button>
                <button class="btn btn-sm btn-danger" onclick="updateApplication(${a.id}, 'rejected')">✕ Reject</button>
              </div>
            ` : ''}
          </div>
        `).join('') : emptyState('No applicants yet', 'Once job seekers apply, they will appear here.')}
      </div>
    </div>
  `;
}

async function updateApplication(appId, status) {
  try {
    await api(`/api/applications/${appId}`, { method: 'PUT', body: { status } });
    toast(`Application ${status}!`, status === 'accepted' ? 'success' : 'info');
    // Update the badge and hide buttons
    const card = document.getElementById(`app-${appId}`);
    if (card) {
      const badge = card.querySelector('.badge');
      if (badge) { badge.className = `badge badge-${status}`; badge.textContent = status; }
      const actions = card.querySelector('.applicant-actions');
      if (actions) actions.remove();
    }
  } catch (err) { toast(err.message, 'error'); }
}

// ── My Applications (Seeker) ─────────────────────────────────
async function renderMyApplications() {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="container"><div class="loading-spinner"><div class="spinner"></div></div></div>`;

  let applications = [];
  try { applications = (await api('/api/applications')).applications; } catch {}

  app.innerHTML = `
    <div class="container">
      <div class="section-title"><h2>📋 My Applications</h2></div>
      ${applications.length > 0 ? `
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>Job</th><th>Employer</th><th>Salary</th><th>Location</th><th>Status</th><th>Applied</th></tr></thead>
            <tbody>
              ${applications.map(a => `
                <tr>
                  <td><strong>${esc(a.job_title)}</strong></td>
                  <td>${esc(a.employer_name)}</td>
                  <td>${esc(a.salary) || '—'}</td>
                  <td>${esc(a.job_location) || '—'}</td>
                  <td><span class="badge badge-${a.status}">${a.status}</span></td>
                  <td>${timeAgo(a.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : emptyState('No applications yet', 'Browse jobs and click "I\'m Interested" to apply!')}
    </div>
  `;
}

// ── Profile ───────────────────────────────────────────────────
async function renderProfile() {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="container"><div class="loading-spinner"><div class="spinner"></div></div></div>`;

  let profile = {};
  try { profile = (await api('/api/profile')).profile || {}; } catch {}

  const initial = (currentUser.name || 'U')[0].toUpperCase();

  app.innerHTML = `
    <div class="container">
      <div class="profile-header">
        <div class="profile-avatar">${initial}</div>
        <div class="profile-info">
          <h2>${esc(currentUser.name)}</h2>
          <p>${esc(currentUser.email)} · ${currentUser.role}</p>
          <div class="profile-badges">
            <span class="badge badge-${currentUser.role}">${currentUser.role}</span>
            ${currentUser.verified ? '<span class="badge badge-verified">✓ Verified</span>' : '<span class="badge badge-unverified">Unverified</span>'}
          </div>
        </div>
      </div>

      <div class="glass-card" style="padding:32px">
        <h3 class="mb-2">Edit Profile</h3>
        <form onsubmit="handleUpdateProfile(event)">
          <div class="form-group">
            <label for="profName">Full Name</label>
            <input type="text" id="profName" class="form-input" value="${esc(currentUser.name)}" required>
          </div>
          ${currentUser.role === 'seeker' ? `
            <div class="form-group">
              <label for="profSkills">Skills</label>
              <input type="text" id="profSkills" class="form-input" value="${esc(profile.skills || '')}" placeholder="e.g., Painting, Driving, Cooking">
              <div class="hint">Comma-separated</div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="profLocation">Location</label>
                <input type="text" id="profLocation" class="form-input" value="${esc(profile.location || '')}" placeholder="Your city">
              </div>
              <div class="form-group">
                <label for="profAvail">Availability</label>
                <select id="profAvail" class="form-select">
                  <option ${profile.availability === 'Full-time' ? 'selected' : ''}>Full-time</option>
                  <option ${profile.availability === 'Part-time' ? 'selected' : ''}>Part-time</option>
                  <option ${profile.availability === 'Weekends' ? 'selected' : ''}>Weekends</option>
                  <option ${profile.availability === 'Flexible' ? 'selected' : ''}>Flexible</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="profPhone">Contact Phone</label>
              <input type="text" id="profPhone" class="form-input" value="${esc(profile.contact_phone || '')}" placeholder="+91 ...">
            </div>
            <div class="form-group">
              <label for="profBio">Bio</label>
              <textarea id="profBio" class="form-textarea" placeholder="Tell employers about yourself...">${esc(profile.bio || '')}</textarea>
            </div>
            <div class="form-group">
              <label for="profExp">Experience</label>
              <textarea id="profExp" class="form-textarea" placeholder="Your work experience...">${esc(profile.experience || '')}</textarea>
            </div>
          ` : ''}
          <button type="submit" class="btn btn-primary btn-lg" id="profBtn">Save Changes</button>
        </form>
      </div>
    </div>
  `;
}

async function handleUpdateProfile(e) {
  e.preventDefault();
  const btn = document.getElementById('profBtn');
  btn.disabled = true; btn.textContent = 'Saving...';
  try {
    const body = { name: document.getElementById('profName').value };
    if (currentUser.role === 'seeker') {
      body.skills = document.getElementById('profSkills').value;
      body.location = document.getElementById('profLocation').value;
      body.availability = document.getElementById('profAvail').value;
      body.contact_phone = document.getElementById('profPhone').value;
      body.bio = document.getElementById('profBio').value;
      body.experience = document.getElementById('profExp').value;
    }
    await api('/api/profile', { method: 'PUT', body });
    currentUser.name = body.name;
    renderNav();
    toast('Profile updated!', 'success');
  } catch (err) { toast(err.message, 'error'); }
  btn.disabled = false; btn.textContent = 'Save Changes';
}

// ── Admin Panel ───────────────────────────────────────────────
let adminTab = 'users';

async function renderAdmin() {
  document.getElementById('app').innerHTML = `
    <div class="container">
      <div class="dashboard-header">
        <h1>⚙️ Admin Panel</h1>
        <p>Manage users, jobs, and platform settings</p>
      </div>
      <div class="admin-tabs">
        <button class="admin-tab ${adminTab==='users'?'active':''}" onclick="switchAdminTab('users')">👥 Users</button>
        <button class="admin-tab ${adminTab==='jobs'?'active':''}" onclick="switchAdminTab('jobs')">💼 Jobs</button>
        <button class="admin-tab ${adminTab==='smtp'?'active':''}" onclick="switchAdminTab('smtp')">📧 SMTP</button>
      </div>
      <div id="adminContent"><div class="loading-spinner"><div class="spinner"></div></div></div>
    </div>
  `;
  await loadAdminTab();
}

function switchAdminTab(tab) {
  adminTab = tab;
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.textContent.toLowerCase().includes(tab)));
  loadAdminTab();
}

async function loadAdminTab() {
  const content = document.getElementById('adminContent');
  content.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

  if (adminTab === 'users') await loadAdminUsers(content);
  else if (adminTab === 'jobs') await loadAdminJobs(content);
  else if (adminTab === 'smtp') await loadAdminSmtp(content);
}

async function loadAdminUsers(el) {
  let users = [];
  try { users = (await api('/api/admin/users')).users; } catch {}
  el.innerHTML = `
    <div class="admin-section">
      <p class="text-muted mb-2">${users.length} total users</p>
      <div class="table-wrapper">
        <table class="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Verified</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            ${users.map(u => `
              <tr id="user-row-${u.id}">
                <td><strong>${esc(u.name)}</strong></td>
                <td>${esc(u.email)}</td>
                <td><span class="badge badge-${u.role}">${u.role}</span></td>
                <td>${u.verified ? '<span class="badge badge-verified">✓ Yes</span>' : '<span class="badge badge-unverified">No</span>'}</td>
                <td>${timeAgo(u.created_at)}</td>
                <td>
                  ${u.role !== 'admin' ? `
                    <div class="flex gap-1">
                      <button class="btn btn-sm ${u.verified ? 'btn-ghost' : 'btn-success'}" onclick="toggleVerify(${u.id}, ${!u.verified})">${u.verified ? 'Unverify' : 'Verify'}</button>
                      <button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id})">Delete</button>
                    </div>
                  ` : '<span class="text-muted">—</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function toggleVerify(id, verified) {
  try {
    await api(`/api/admin/users/${id}/verify`, { method: 'PUT', body: { verified } });
    toast(verified ? 'User verified' : 'Verification removed', 'success');
    loadAdminTab();
  } catch (err) { toast(err.message, 'error'); }
}

async function deleteUser(id) {
  if (!confirm('Delete this user? This cannot be undone.')) return;
  try {
    await api(`/api/admin/users/${id}`, { method: 'DELETE' });
    toast('User deleted', 'success');
    document.getElementById(`user-row-${id}`)?.closest('tr')?.remove();
  } catch (err) { toast(err.message, 'error'); }
}

async function loadAdminJobs(el) {
  let jobs = [];
  try { jobs = (await api('/api/admin/jobs')).jobs; } catch {}
  el.innerHTML = `
    <div class="admin-section">
      <p class="text-muted mb-2">${jobs.length} total jobs</p>
      <div class="table-wrapper">
        <table class="data-table">
          <thead><tr><th>Title</th><th>Employer</th><th>Location</th><th>Applicants</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${jobs.map(j => `
              <tr id="admin-job-${j.id}">
                <td><strong>${esc(j.title)}</strong></td>
                <td>${esc(j.employer_name)}</td>
                <td>${esc(j.location) || '—'}</td>
                <td>${j.applicant_count || 0}</td>
                <td><span class="badge badge-${j.status}">${j.status}</span></td>
                <td>
                  ${j.status !== 'removed' ? `
                    <button class="btn btn-sm btn-danger" onclick="adminRemoveJob(${j.id})">Remove</button>
                  ` : '<span class="text-muted">Removed</span>'}
                </td>
              </tr>
            `).join('')}
            ${jobs.length === 0 ? '<tr><td colspan="6" class="text-center text-muted" style="padding:32px">No jobs found</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function adminRemoveJob(id) {
  if (!confirm('Remove this job posting?')) return;
  try {
    await api(`/api/admin/jobs/${id}`, { method: 'DELETE' });
    toast('Job removed', 'success');
    loadAdminTab();
  } catch (err) { toast(err.message, 'error'); }
}

async function loadAdminSmtp(el) {
  let settings = {};
  try { settings = (await api('/api/admin/smtp')).settings || {}; } catch {}
  el.innerHTML = `
    <div class="admin-section">
      <div class="glass-card" style="padding:32px;max-width:600px">
        <h3 class="mb-2">📧 SMTP Email Settings</h3>
        <p class="text-muted mb-3">Configure email notifications for the platform</p>
        <form onsubmit="saveSmtp(event)">
          <div class="form-row">
            <div class="form-group">
              <label>SMTP Host</label>
              <input type="text" id="smtpHost" class="form-input" value="${esc(settings.host || '')}" placeholder="smtp.gmail.com">
            </div>
            <div class="form-group">
              <label>Port</label>
              <input type="number" id="smtpPort" class="form-input" value="${settings.port || 587}" placeholder="587">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Username</label>
              <input type="text" id="smtpUser" class="form-input" value="${esc(settings.username || '')}" placeholder="your@email.com">
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" id="smtpPass" class="form-input" value="${esc(settings.password || '')}" placeholder="App password">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Sender Name</label>
              <input type="text" id="smtpSenderName" class="form-input" value="${esc(settings.sender_name || 'Workify')}" placeholder="Workify">
            </div>
            <div class="form-group">
              <label>Sender Email</label>
              <input type="text" id="smtpSenderEmail" class="form-input" value="${esc(settings.sender_email || '')}" placeholder="noreply@workify.com">
            </div>
          </div>
          <label class="form-check mb-3">
            <input type="checkbox" id="smtpSecure" ${settings.secure ? 'checked' : ''}> Use SSL/TLS (port 465)
          </label>
          <div class="flex gap-1">
            <button type="submit" class="btn btn-primary" id="smtpSaveBtn">Save Settings</button>
            <button type="button" class="btn btn-outline" onclick="testSmtp()">Send Test Email</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

async function saveSmtp(e) {
  e.preventDefault();
  const btn = document.getElementById('smtpSaveBtn');
  btn.disabled = true;
  try {
    await api('/api/admin/smtp', {
      method: 'PUT',
      body: {
        host: document.getElementById('smtpHost').value,
        port: parseInt(document.getElementById('smtpPort').value),
        username: document.getElementById('smtpUser').value,
        password: document.getElementById('smtpPass').value,
        sender_name: document.getElementById('smtpSenderName').value,
        sender_email: document.getElementById('smtpSenderEmail').value,
        secure: document.getElementById('smtpSecure').checked
      }
    });
    toast('SMTP settings saved!', 'success');
  } catch (err) { toast(err.message, 'error'); }
  btn.disabled = false;
}

async function testSmtp() {
  const email = prompt('Enter email to send test to:');
  if (!email) return;
  try {
    await api('/api/admin/smtp/test', { method: 'POST', body: { test_email: email } });
    toast('Test email sent successfully!', 'success');
  } catch (err) { toast(err.message, 'error'); }
}

// ── 404 ───────────────────────────────────────────────────────
function renderNotFound() {
  document.getElementById('app').innerHTML = `
    <div class="container">
      ${emptyState('Page Not Found', 'The page you\'re looking for doesn\'t exist.')}
      <div class="text-center"><button class="btn btn-primary" onclick="navigate('/')">Go Home</button></div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'Z');
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return d.toLocaleDateString();
}

function emptyState(title, desc) {
  return `
    <div class="empty-state">
      <div class="empty-icon">📭</div>
      <h3>${title}</h3>
      <p>${desc}</p>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

// Apply saved theme
setTheme(getTheme());

// Listen for hash changes
window.addEventListener('hashchange', () => {
  currentPage = ''; // force re-render
  router();
});

// Initial route
router();
