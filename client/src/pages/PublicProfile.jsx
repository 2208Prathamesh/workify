import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { api } from '../lib/api'
import { Spinner } from '../components/UI'
import { StarDisplay, StarPicker, ReviewCard } from '../components/RatingStars'
import MapCard from '../components/MapCard'
import WhatsAppBtn from '../components/WhatsAppBtn'

const STATUS_MAP = {
  available: { label: '🟢 Available Now', cls: 'status-available' },
  looking:   { label: '🔵 Looking',       cls: 'status-looking'   },
  busy:      { label: '🔴 Busy',          cls: 'status-busy'      },
}

export default function PublicProfile() {
  const { id } = useParams()
  const { user } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()

  const [data, setData]         = useState(null)
  const [ratings, setRatings]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showRate, setShowRate] = useState(false)
  const [stars, setStars]       = useState(0)
  const [review, setReview]     = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      api(`/api/profile/${id}`),
      api(`/api/ratings/user/${id}`)
    ]).then(([pd, rd]) => {
      setData(pd)
      setRatings(rd.ratings)
    }).catch(() => toast.error('Profile not found'))
      .finally(() => setLoading(false))
  }, [id])

  const submitRating = async () => {
    if (!stars) { toast.error('Please select a star rating'); return }
    setSubmitting(true)
    try {
      await api('/api/ratings', { method: 'POST', body: { seeker_id: +id, stars, review } })
      toast.success('Rating submitted! ⭐')
      setShowRate(false)
      // Refresh ratings
      const rd = await api(`/api/ratings/user/${id}`)
      setRatings(rd.ratings)
      const pd = await api(`/api/profile/${id}`)
      setData(pd)
    } catch (err) { toast.error(err.message) }
    setSubmitting(false)
  }

  if (loading) return <div className="container"><Spinner /></div>
  if (!data) return <div className="container"><p>Profile not found.</p></div>

  const { user: u, profile: p, rating } = data
  const skills    = p.skills ? p.skills.split(',').map(s => s.trim()).filter(Boolean) : []
  const langs     = p.languages ? p.languages.split(',').map(s => s.trim()).filter(Boolean) : []
  const portfolio = (() => { try { return JSON.parse(p.portfolio || '[]') } catch { return [] } })()
  const statusInfo = STATUS_MAP[p.availability_status] || STATUS_MAP.looking

  return (
    <div className="container" style={{ maxWidth: 800, margin: '0 auto' }}>
      <button className="btn btn-ghost mb-2" onClick={() => navigate(-1)}>{t('back')}</button>

      {/* ── PROFILE HERO ── */}
      <div className="pub-profile-hero glass-card">
        <div className="pub-avatar-wrap">
          {u.avatar_url
            ? <img src={u.avatar_url} alt={u.name} className="pub-avatar-img" />
            : <div className="pub-avatar-initial">{(u.name || 'U')[0]}</div>
          }
          <div className={`pub-status-dot ${p.availability_status || 'looking'}`} title={statusInfo.label} />
        </div>

        <div className="pub-hero-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 className="pub-name">{u.name}</h1>
            {u.verified && <span className="badge badge-verified">✓ {t('verified')}</span>}
          </div>
          <div className={`pub-status-badge ${statusInfo.cls}`}>{statusInfo.label}</div>

          {rating.avg != null ? (
            <div className="pub-rating-row">
              <StarDisplay rating={rating.avg} size="lg" />
              <span className="pub-rating-count">({rating.count} {t('reviewsSection')}{rating.count !== 1 ? '' : ''})</span>
            </div>
          ) : (
            <div className="pub-rating-row" style={{ color: 'var(--text-muted)' }}>{t('noReviewYet')}</div>
          )}

          {p.daily_rate && (
            <div className="pub-rate">💰 {p.daily_rate}</div>
          )}
        </div>

        <div className="pub-hero-actions">
          {/* In-app message button — primary contact method */}
          {user && user.id !== +id && (
            <button className="btn btn-primary btn-md"
              onClick={() => navigate(`/messages?to=${id}`)}>
              {t('sendMessage')}
            </button>
          )}
          {p.whatsapp && (
            <WhatsAppBtn number={p.whatsapp} name={u.name} size="md" />
          )}
          {p.contact_phone && (
            <a href={`tel:${p.contact_phone}`} className="btn btn-outline btn-md">
              {t('callBtn')}
            </a>
          )}
          {user?.role === 'employer' && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowRate(r => !r)}>
              ⭐ {t('rateWorker')}
            </button>
          )}
        </div>
      </div>

      {/* ── RATE WORKER FORM ── */}
      {showRate && (
        <div className="glass-card p-4 mb-3">
          <h3 className="mb-2">⭐ {t('rateWorker')}</h3>
          <StarPicker value={stars} onChange={setStars} />
          <textarea className="form-textarea mt-2" placeholder={t('addReview')}
            value={review} onChange={e => setReview(e.target.value)} rows={3} />
          <div className="flex gap-1 mt-2">
            <button className="btn btn-primary" disabled={submitting || !stars} onClick={submitRating}>
              {submitting ? 'Submitting…' : t('submitRating')}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowRate(false)}>{t('close')}</button>
          </div>
        </div>
      )}

      {/* ── TWO COLUMN LAYOUT ── */}
      <div className="pub-grid">

        {/* LEFT — Details */}
        <div className="pub-left">

          {/* About */}
          {p.bio && (
            <div className="pub-section glass-card">
              <h3 className="pub-section-title">{t('aboutSection')}</h3>
              <p className="pub-bio">{p.bio}</p>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 ? (
            <div className="pub-section glass-card">
              <h3 className="pub-section-title">🛠️ {t('skills')}</h3>
              <div className="skill-chips">
                {skills.map(s => <span key={s} className="skill-chip">{s}</span>)}
              </div>
            </div>
          ) : (
            <div className="pub-section glass-card">
              <span className="skill-chip" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--green)' }}>
                ✅ {t('noExpNeeded')}
              </span>
            </div>
          )}

          {/* Work Experience */}
          {p.experience && (
            <div className="pub-section glass-card">
              <h3 className="pub-section-title">💼 {t('experience')}</h3>
              <div className="pub-experience">
                {p.experience.split('\n').filter(Boolean).map((line, i) => (
                  <div key={i} className="exp-line">
                    <span className="exp-bullet">▸</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio */}
          {portfolio.length > 0 && (
            <div className="pub-section glass-card">
              <h3 className="pub-section-title">📁 {t('portfolio')}</h3>
              <div className="portfolio-grid">
                {portfolio.map((item, i) => (
                  <div key={i} className="portfolio-item">
                    <div className="portfolio-icon">💼</div>
                    <div>
                      <div className="portfolio-title">{item.title}</div>
                      {item.desc && <div className="portfolio-desc">{item.desc}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Info & Map */}
        <div className="pub-right">

          {/* Quick info card */}
          <div className="pub-section glass-card">
            <h3 className="pub-section-title">{t('detailsSection')}</h3>
            <ul className="pub-details-list">
              {p.location && <li><span>📍</span><span>{p.location}</span></li>}
              {p.availability && <li><span>⏰</span><span>{p.availability}</span></li>}
              {p.daily_rate && <li><span>💰</span><span>{p.daily_rate}</span></li>}
              {langs.length > 0 && <li>
                <span>🗣️</span>
                <span>
                  {langs.map(l => <span key={l} className="lang-tag">{l}</span>)}
                </span>
              </li>}
              <li>
                <span>📅</span>
                <span>{t('onWorkifySince')} {new Date(u.created_at + 'Z').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
              </li>
            </ul>
          </div>

          {/* Map */}
          {p.location && (
            <div className="pub-section">
              <h3 className="pub-section-title mb-1">{t('locationSection')}</h3>
              <MapCard location={p.location} />
            </div>
          )}

          {/* Hire this person CTA */}
          {user?.role === 'employer' && (
            <div className="pub-cta glass-card">
              <div className="pub-cta-text">{t('readyToHire')} {u.name}?</div>
              <div className="flex gap-1">
                {p.whatsapp && <WhatsAppBtn number={p.whatsapp} name={u.name} size="sm" />}
                {p.contact_phone && <a href={`tel:${p.contact_phone}`} className="btn btn-outline btn-sm">{t('callBtn')}</a>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── REVIEWS ── */}
      <div className="pub-section">
        <h2 className="section-heading" style={{ fontSize: '1.3rem', marginBottom: 16 }}>
          ⭐ {t('reviewsSection')} ({rating.count})
        </h2>
        {ratings.length > 0
          ? ratings.map(r => <ReviewCard key={r.id} rating={r} />)
          : <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-icon">⭐</div>
              <h3>{t('noRatings')}</h3>
              <p>{t('beFirstReview')}</p>
            </div>
        }
      </div>
    </div>
  )
}
