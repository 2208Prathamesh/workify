import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'

export default function Signup() {
  const { user, signup } = useAuth()
  const { t, lang, setLang } = useLang()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'seeker' })
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (user) navigate('/dashboard') }, [user, navigate])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const u = await signup(form)
      toast.success(`Welcome to Workify, ${u.name}! 🎉`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card glass-card" style={{ maxWidth: 500 }}>
        <div className="auth-logo">
          <div className="logo-icon">W</div>
          <span className="auth-logo-name">Workify</span>
        </div>

        {/* Inline language switcher */}
        <div className="auth-lang-row">
          {[{ code: 'en', label: 'English' }, { code: 'hi', label: 'हिन्दी' }, { code: 'mr', label: 'मराठी' }]
            .map(l => (
              <button key={l.code}
                className={`auth-lang-btn${lang === l.code ? ' active' : ''}`}
                onClick={() => setLang(l.code, false)}>
                {l.label}
              </button>
            ))}
        </div>

        <h2>{t('joinWorkify')}</h2>
        <p className="auth-subtitle">
          {t('iWantTo')} — {t('findWork')} / {t('hireWorkers')}
        </p>

        {/* Role selector */}
        <div className="role-selector" style={{ marginBottom: 24 }}>
          {[
            { value: 'seeker',   icon: '👷', name: t('findWork'),    desc: t('noExpNeeded') },
            { value: 'employer', icon: '🏢', name: t('hireWorkers'), desc: 'Post jobs & hire' },
          ].map(r => (
            <div key={r.value}
              className={`role-option${form.role === r.value ? ' selected' : ''}`}
              onClick={() => set('role', r.value)}>
              <div className="role-icon">{r.icon}</div>
              <div className="role-name">{r.name}</div>
              <div className="role-desc">{r.desc}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('fullName')}</label>
            <input className="form-input" required placeholder={t('fullName')}
              value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{t('emailAddr')}</label>
            <input type="email" className="form-input" required placeholder="you@example.com"
              value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{t('password')}</label>
            <input type="password" className="form-input" required placeholder="Min. 6 characters"
              value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? t('loading') : t('createAccount')}
          </button>
        </form>

        <div className="auth-footer">
          {t('alreadyHaveAccount')}{' '}
          <Link to="/login">{t('login')}</Link>
        </div>
      </div>
    </div>
  )
}
