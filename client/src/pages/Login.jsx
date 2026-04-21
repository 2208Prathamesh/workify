import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'

export default function Login() {
  const { user, login } = useAuth()
  const { t, setLang, syncLangFromUser, lang } = useLang()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (user) navigate('/dashboard') }, [user, navigate])

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const u = await login(form.email, form.password)
      // Sync user's saved language preference from DB
      syncLangFromUser(u)
      toast.success(`${t('welcomeBack')} ${u.name}! 👋`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div className="auth-logo">
          <div className="logo-icon">W</div>
          <span className="auth-logo-name">Workify</span>
        </div>

        {/* Inline language switcher on auth page */}
        <div className="auth-lang-row">
          {[
            { code: 'en', label: 'English' },
            { code: 'hi', label: 'हिन्दी' },
            { code: 'mr', label: 'मराठी' }
          ].map(l => (
            <button key={l.code}
              className={`auth-lang-btn${lang === l.code ? ' active' : ''}`}
              onClick={() => setLang(l.code, false)}>
              {l.label}
            </button>
          ))}
        </div>

        <h2>{t('welcomeBack')}</h2>
        <p className="auth-subtitle">{t('loginSubtitle')}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">{t('emailAddr')}</label>
            <input id="email" type="email" className="form-input"
              placeholder="you@example.com" required autoComplete="email"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label htmlFor="password">{t('password')}</label>
            <input id="password" type="password" className="form-input"
              placeholder="••••••••" required autoComplete="current-password"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? `${t('loading')}` : `${t('login')} →`}
          </button>
        </form>

        <div className="auth-footer">
          {t('dontHaveAccount')}{' '}
          <Link to="/signup">{t('createAccount')}</Link>
        </div>
      </div>
    </div>
  )
}
