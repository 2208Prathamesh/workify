import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { JOB_CATEGORIES } from '../lib/constants'

function Counter({ target, elRef }) {
  useEffect(() => {
    if (!elRef.current) return
    let current = 0
    const step = Math.max(1, Math.ceil(target / 40))
    const timer = setInterval(() => {
      current = Math.min(current + step, target)
      if (elRef.current) elRef.current.textContent = current
      if (current >= target) clearInterval(timer)
    }, 30)
    return () => clearInterval(timer)
  }, [target, elRef])
  return null
}

export default function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const jobsRef  = useRef(null)
  const workRef  = useRef(null)
  const empRef   = useRef(null)

  useEffect(() => {
    if (user) { navigate('/dashboard'); return }

    // seed counters with placeholder then load real stats
    if (jobsRef.current)  jobsRef.current.textContent  = '0'
    if (workRef.current)  workRef.current.textContent  = '0'
    if (empRef.current)   empRef.current.textContent   = '0'

    const animate = (ref, to) => {
      let c = 0; const step = Math.max(1, Math.ceil(to / 40))
      const t = setInterval(() => {
        c = Math.min(c + step, to)
        if (ref.current) ref.current.textContent = c
        if (c >= to) clearInterval(t)
      }, 30)
    }

    api('/api/jobs')
      .then(d => animate(jobsRef, d.jobs.length))
      .catch(() => animate(jobsRef, 5))

    api('/api/admin/stats')
      .then(d => {
        animate(workRef, d.stats.totalSeekers || 0)
        animate(empRef,  d.stats.totalEmployers || 0)
      })
      .catch(() => { animate(workRef, 50); animate(empRef, 20) })
  }, [user, navigate])

  if (user) return null

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-float-icons">
          {['🔨','🚜','🍳','📦','🧹','🚚','🌾'].map((ic, i) => (
            <span key={i} className="float-icon">{ic}</span>
          ))}
        </div>

        <div className="hero-badge">🚀 India's #1 Daily Work Platform</div>

        <h1>Find Work Today.<br /><span className="gradient-text">Any Skills Welcome.</span></h1>

        <p className="hero-sub">
          Connect with employers near you — no resume, no degree needed.<br />
          Construction, Delivery, Domestic, Kitchen, Agriculture &amp; more.
        </p>

        <div className="hero-tag">
          ✅ No Resume Required &nbsp;·&nbsp; 💰 Get Paid Fast &nbsp;·&nbsp; 📍 Work Near You
        </div>

        <div className="hero-actions">
          <button className="btn btn-primary btn-xl" onClick={() => navigate('/signup')}>Find Work Now →</button>
          <button className="btn btn-outline btn-lg"  onClick={() => navigate('/login')}>I'm an Employer</button>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="stat-value" ref={jobsRef}>—</div>
            <div className="stat-label">Active Jobs</div>
          </div>
          <div className="hero-stat">
            <div className="stat-value" ref={workRef}>—</div>
            <div className="stat-label">Workers</div>
          </div>
          <div className="hero-stat">
            <div className="stat-value" ref={empRef}>—</div>
            <div className="stat-label">Employers</div>
          </div>
        </div>

        <div className="hero-categories">
          {JOB_CATEGORIES.filter(c => c.id !== 'All').map(c => (
            <div key={c.id} className="cat-pill" onClick={() => navigate('/signup')}>
              {c.icon} {c.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how-it-works">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="section-label">Simple Process</div>
          <h2 className="section-heading">Get Working in 3 Simple Steps</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto' }}>
            No complicated forms. No waiting weeks. Start working today.
          </p>
          <div className="steps-grid">
            {[
              { n: '01', icon: '📝', title: 'Create Free Account', desc: 'Sign up in under 60 seconds. Just your name and what work you want. No degree needed.' },
              { n: '02', icon: '🔍', title: 'Browse Local Jobs',   desc: 'See jobs near you filtered by category, daily pay, and urgency. Find "Hiring Today" jobs.' },
              { n: '03', icon: '✅', title: 'Apply & Get Hired',   desc: 'One click to show interest. Employer reviews your profile and contacts you directly.' },
            ].map(s => (
              <div key={s.n} className="step-card">
                <div className="step-number">Step {s.n}</div>
                <span className="step-icon">{s.icon}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features-section">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="section-label">Why Workify</div>
          <h2 className="section-heading">Built for Every Worker, Every Employer</h2>
          <div className="features-grid">
            {[
              { icon: '🎯', color: 'orange', title: 'No Skills? No Problem', desc: 'Many jobs require zero prior experience — cleaning, loading, farming helper, kitchen assistant.' },
              { icon: '⚡', color: 'purple', title: 'Hiring Today',          desc: 'See urgent jobs that need workers immediately. Posted with "Hiring Today" flag for instant matching.' },
              { icon: '💰', color: 'green',  title: 'Daily Pay Clarity',    desc: 'Every job shows exact daily/hourly pay. Know what you earn before you apply.' },
            ].map(f => (
              <div key={f.title} className="feature-card">
                <div className={`feature-icon-wrap ${f.color}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="testimonials">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="section-label">Real Stories</div>
          <h2 className="section-heading">Workers &amp; Employers Love Workify</h2>
          <div className="testimonials-grid">
            {[
              { av: '👨', stars: 5, quote: '"I found a construction helper job within 2 hours. The pay was ₹600/day and they included lunch. This app changed my life!"', name: 'Ramesh Kumar', role: 'Construction Worker, Mumbai' },
              { av: '👩', stars: 5, quote: '"As a housewife who needed part-time cooking work, I found domestic jobs easily. No complicated forms, just simple apply and call."', name: 'Sunita Devi', role: 'Home Cook, Delhi' },
              { av: '🏢', stars: 5, quote: '"We hired 12 warehouse workers for our peak season through Workify in 3 days. Excellent quality and the process was so easy."', name: 'Priya Sharma', role: 'Warehouse Manager, Pune' },
            ].map(t => (
              <div key={t.name} className="testimonial-card">
                <div className="t-avatar">{t.av}</div>
                <div className="t-stars">{'★'.repeat(t.stars)}</div>
                <p className="t-quote">{t.quote}</p>
                <div className="t-name">{t.name}</div>
                <div className="t-role">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand footer-col">
            <div className="logo-icon">W</div>
            <div className="footer-name">Workify</div>
            <p>Connecting daily-wage workers with employers across India. No resume. No barrier. Just work.</p>
          </div>
          {[
            { heading: 'For Workers',  links: [{ label: 'Find Jobs', to: '/signup' }, { label: 'Login', to: '/login' }] },
            { heading: 'For Employers',links: [{ label: 'Post a Job', to: '/signup' }, { label: 'Login', to: '/login' }] },
            { heading: 'Categories',   links: [{ label: '🏗️ Construction', to: '/signup' }, { label: '🏠 Domestic', to: '/signup' }, { label: '🚚 Delivery', to: '/signup' }, { label: '🌾 Agriculture', to: '/signup' }] },
          ].map(col => (
            <div key={col.heading} className="footer-col">
              <h4>{col.heading}</h4>
              <ul>
                {col.links.map(l => (
                  <li key={l.label}><a href="#" onClick={e => { e.preventDefault(); navigate(l.to) }}>{l.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© 2026 Workify — Work for Everyone.</span>
          <span>Made with ❤️ for India's Workforce</span>
        </div>
      </footer>
    </>
  )
}
