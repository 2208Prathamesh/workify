import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { api } from '../lib/api'
import { Spinner } from '../components/UI'
import AvatarUpload from '../components/AvatarUpload'
import WhatsAppBtn from '../components/WhatsAppBtn'

const AVAILABILITY_OPTS = [
  { value: 'available', emoji: '🟢', labelKey: 'availableNow' },
  { value: 'looking',   emoji: '🔵', labelKey: 'looking'      },
  { value: 'busy',      emoji: '🔴', labelKey: 'busy'         },
]

export default function Profile() {
  const { user, loading: authLoading, updateUser } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState({})
  const [portfolio, setPortfolio] = useState([])

  // Auto-detect location via Geolocation API
  const detectLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return }
    toast(t('detectLocation') + '…', { icon: '📍' })
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
        )
        const data = await res.json()
        const area = data.address?.suburb || data.address?.neighbourhood || data.address?.town
                  || data.address?.city   || data.address?.state_district || ''
        if (area) {
          setForm(f => ({ ...f, location: area }))
          toast.success(`${t('location')} set: ${area} 📍`)
        }
      } catch { toast.error('Could not fetch location name') }
    }, () => toast.error('Location permission denied'))
  }

  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return }
    api('/api/profile').then(d => {
      const p = d.profile || {}
      setForm({
        name:                user.name || '',
        skills:              p.skills || '',
        location:            p.location || '',
        availability:        p.availability || 'Full-time',
        contact_phone:       p.contact_phone || '',
        bio:                 p.bio || '',
        experience:          p.experience || '',
        languages:           p.languages || '',
        daily_rate:          p.daily_rate || '',
        availability_status: p.availability_status || 'looking',
        whatsapp:            p.whatsapp || '',
      })
      try { setPortfolio(JSON.parse(p.portfolio || '[]')) } catch { setPortfolio([]) }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user, authLoading, navigate])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addPortfolioItem  = () => setPortfolio(p => [...p, { title: '', desc: '' }])
  const updatePortfolio   = (i, k, v) => setPortfolio(p => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it))
  const removePortfolio   = (i) => setPortfolio(p => p.filter((_, idx) => idx !== i))

  const handleGalleryUpload = async (e, i) => {
    const file = e.target.files?.[0]
    if (!file) return
    const body = new FormData()
    body.append('image', file)
    const toastId = toast.loading(t('uploadPhoto') + '...')
    try {
      const d = await api('/api/profile/gallery', { method: 'POST', body })
      updatePortfolio(i, 'image_url', d.url)
      toast.success(t('uploadPhoto') + ' ✓', { id: toastId })
    } catch (err) {
      toast.error(err.message, { id: toastId })
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await api('/api/profile', { method: 'PUT', body: { ...form, portfolio } })
      updateUser({ name: form.name })
      toast.success(`${t('saveChanges')} ✅`)
    } catch (err) { toast.error(err.message) }
    setSaving(false)
  }

  if (authLoading || loading || !user) return <div className="container"><Spinner /></div>

  const statusOpt = AVAILABILITY_OPTS.find(o => o.value === form.availability_status) || AVAILABILITY_OPTS[1]

  return (
    <div className="container" style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* Hero */}
      <div className="profile-hero glass-card">
        <AvatarUpload
          currentUrl={user.avatar_url}
          name={user.name}
          onUploaded={url => updateUser({ avatar_url: url })}
        />
        <div className="profile-info">
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <div className="profile-badges">
            <span className={`badge badge-${user.role}`}>{user.role}</span>
            {user.verified
              ? <span className="badge badge-verified">✓ {t('verified')}</span>
              : <span className="badge badge-unverified">Unverified</span>}
            {form.availability_status && (
              <span className={`availability-chip ${form.availability_status}`}>
                {statusOpt.emoji} {t(statusOpt.labelKey)}
              </span>
            )}
          </div>
          {user.role === 'seeker' && (
            <button className="btn btn-ghost btn-sm mt-1"
              onClick={() => navigate(`/worker/${user.id}`)}>
              {t('previewPublicProfile')}
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="glass-card" style={{ padding: 36 }}>
        <h3 className="mb-3">{t('editProfile')}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('fullNameLabel')}</label>
            <input className="form-input" required value={form.name}
              onChange={e => set('name', e.target.value)} />
          </div>

          {user.role === 'seeker' ? (
            <>
              {/* Availability Status */}
              <div className="form-group">
                <label>{t('availabilityStatus')}</label>
                <div className="availability-selector">
                  {AVAILABILITY_OPTS.map(o => (
                    <div key={o.value}
                      className={`avail-option${form.availability_status === o.value ? ' selected' : ''}`}
                      onClick={() => set('availability_status', o.value)}>
                      <span>{o.emoji}</span> {t(o.labelKey)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>{t('skills')}</label>
                <input className="form-input" placeholder="e.g., Painting, Driving, Cooking"
                  value={form.skills} onChange={e => set('skills', e.target.value)} />
                <div className="hint">{t('skillsHint')}</div>
              </div>

              {/* Location with auto-detect */}
              <div className="form-group">
                <label>{t('location')}</label>
                <div className="input-with-action">
                  <input className="form-input" placeholder="Your city or area"
                    value={form.location} onChange={e => set('location', e.target.value)} />
                  <button type="button" className="btn btn-ghost btn-sm detect-btn"
                    onClick={detectLocation} title="Auto-detect from GPS">
                    {t('detectLocation')}
                  </button>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('contactPhone')}</label>
                  <input className="form-input" placeholder="+91 9876543210"
                    value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>{t('whatsapp')}</label>
                  <input className="form-input" placeholder="+91 9876543210"
                    value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('availability')}</label>
                  <select className="form-select" value={form.availability}
                    onChange={e => set('availability', e.target.value)}>
                    {['Full-time','Part-time','Weekends','Flexible'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('dailyRate')}</label>
                  <input className="form-input" placeholder="e.g., ₹600/day"
                    value={form.daily_rate} onChange={e => set('daily_rate', e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>{t('languages')}</label>
                <input className="form-input" placeholder="e.g., Hindi, English, Marathi"
                  value={form.languages} onChange={e => set('languages', e.target.value)} />
              </div>

              <div className="form-group">
                <label>{t('bio')}</label>
                <textarea className="form-textarea" placeholder="Tell employers about yourself…"
                  rows={3} value={form.bio} onChange={e => set('bio', e.target.value)} />
              </div>

              <div className="form-group">
                <label>{t('experience')}</label>
                <textarea className="form-textarea"
                  placeholder={t('expPlaceholder')}
                  rows={3} value={form.experience} onChange={e => set('experience', e.target.value)} />
              </div>

              {/* Portfolio */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <label>{t('portfolio')}</label>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addPortfolioItem}>{t('addPortfolioPhoto')}</button>
                </div>
                {portfolio.map((item, i) => (
                  <div key={i} className="portfolio-form-item" style={{ border: '1px solid var(--border)', padding: 12, borderRadius: 8, marginBottom: 12 }}>
                    {item.image_url ? (
                      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 8 }}>
                        <img src={item.image_url} alt="Work example" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => updatePortfolio(i, 'image_url', '')}>{t('changePhoto')}</button>
                      </div>
                    ) : (
                      <div style={{ marginBottom: 16 }}>
                        <span style={{ fontSize: '0.85rem', display: 'block', marginBottom: 8 }}>{t('uploadWorkPhoto')}</span>
                        <input type="file" accept="image/*" onChange={e => handleGalleryUpload(e, i)} style={{ fontSize: '0.8rem' }} />
                      </div>
                    )}
                    <input className="form-input" placeholder={t('workTaskPlaceholder')}
                      value={item.title} onChange={e => updatePortfolio(i, 'title', e.target.value)} />
                    <input className="form-input mt-1" placeholder={t('briefDescOptional')}
                      value={item.desc} onChange={e => updatePortfolio(i, 'desc', e.target.value)} />
                    <button type="button" className="btn btn-ghost btn-sm mt-3" style={{ color: 'var(--red)' }}
                      onClick={() => removePortfolio(i)}>{t('removeEntry')}</button>
                  </div>
                ))}
                {portfolio.length === 0 && (
                  <p className="hint">{t('portfolioHint')}</p>
                )}
              </div>
            </>
          ) : (
            /* Employer */
            <div className="form-row">
              <div className="form-group">
                <label>{t('contactPhone')}</label>
                <input className="form-input" value={form.contact_phone}
                  onChange={e => set('contact_phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label>{t('whatsapp')}</label>
                <input className="form-input" value={form.whatsapp}
                  onChange={e => set('whatsapp', e.target.value)} />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? t('saving') : t('saveChanges')}
          </button>
        </form>
      </div>
    </div>
  )
}
