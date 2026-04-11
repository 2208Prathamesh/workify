import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLang } from '../context/LangContext'
import { api } from '../lib/api'

const LANGS = [
  { code: 'en', flag: '🇬🇧', label: 'EN'  },
  { code: 'hi', flag: '🇮🇳', label: 'हि'  },
  { code: 'mr', flag: '🇮🇳', label: 'म'   },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const { lang, setLang, t } = useLang()
  const navigate = useNavigate()
  const [open, setOpen]         = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [notifsOpen, setNotifsOpen] = useState(false)
  const [unread, setUnread]     = useState(0)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [notifs, setNotifs]     = useState([])
  const langRef                  = useRef(null)
  const notifsRef                = useRef(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = e => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false)
      if (notifsRef.current && !notifsRef.current.contains(e.target)) setNotifsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const close = () => { setOpen(false); setLangOpen(false) }

  // Poll unread messages & notifications when logged in
  useEffect(() => {
    if (!user) { setUnread(0); setUnreadNotifs(0); return }
    const poll = async () => {
      try {
        const [msgRes, notifRes] = await Promise.all([
          api('/api/messages/unread'),
          api('/api/notifications?filter=unread')
        ])
        setUnread(msgRes.count || 0)
        setUnreadNotifs(notifRes.unreadCount || 0)
        if (notifsOpen) {
          const all = await api('/api/notifications')
          setNotifs(all.notifications || [])
        } else {
          setNotifs(notifRes.notifications || [])
        }
      } catch {}
    }
    poll()
    const id = setInterval(poll, 15000) // every 15s
    return () => clearInterval(id)
  }, [user, notifsOpen])

  const handleNotifsToggle = async () => {
    setNotifsOpen(o => {
      if (!o) { // opening
        api('/api/notifications').then(d => setNotifs(d.notifications || [])).catch(()=>{})
      }
      return !o
    })
  }

  const markRead = async (id, link) => {
    try {
      await api(`/api/notifications/${id}/read`, { method: 'PUT' })
      setNotifs(ns => ns.map(n => n.id === id ? { ...n, is_read: 1 } : n))
      setUnreadNotifs(u => Math.max(0, u - 1))
      setNotifsOpen(false)
      if (link) navigate(link)
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await api('/api/notifications/read-all', { method: 'PUT' })
      setNotifs(ns => ns.map(n => ({ ...n, is_read: 1 })))
      setUnreadNotifs(0)
    } catch {}
  }

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out. See you soon! 👋')
    navigate('/')
    close()
  }

  const handleLang = (code) => {
    setLang(code, !!user)  // persist to DB if logged in
    setLangOpen(false)
  }

  const currentLang = LANGS.find(l => l.code === lang) || LANGS[0]

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => { navigate('/'); close() }}>
        <div className="logo-icon">W</div>
        <span>Workify</span>
      </div>

      <button className="mobile-toggle" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
        <span /><span /><span />
      </button>

      <ul className={`navbar-nav${open ? ' open' : ''}`}>
        {!user ? (
          <>
            <li><NavLink to="/login"  onClick={close}>{t('login')}</NavLink></li>
            <li><NavLink to="/signup" onClick={close} className="btn btn-primary btn-sm">{t('signup')}</NavLink></li>
          </>
        ) : (
          <>
            {user.role === 'seeker' && <>
              <li><NavLink to="/dashboard"    onClick={close}>{t('dashboard')}</NavLink></li>
              <li><NavLink to="/jobs"         onClick={close}>{t('findJobs')}</NavLink></li>
              <li><NavLink to="/applications" onClick={close}>{t('applications')}</NavLink></li>
              <li>
                <NavLink to="/messages" onClick={close} className="nav-msg-link">
                  💬 {t('messages')}
                  {unread > 0 && <span className="nav-unread-badge">{unread > 9 ? '9+' : unread}</span>}
                </NavLink>
              </li>
              <li><NavLink to="/profile" onClick={close}>{t('profile')}</NavLink></li>
            </>}
            {user.role === 'employer' && <>
              <li><NavLink to="/dashboard" onClick={close}>{t('dashboard')}</NavLink></li>
              <li><NavLink to="/post-job"  onClick={close}>{t('postJob')}</NavLink></li>
              <li><NavLink to="/my-jobs"   onClick={close}>{t('myJobs')}</NavLink></li>
              <li>
                <NavLink to="/messages" onClick={close} className="nav-msg-link">
                  💬 {t('messages')}
                  {unread > 0 && <span className="nav-unread-badge">{unread > 9 ? '9+' : unread}</span>}
                </NavLink>
              </li>
              <li><NavLink to="/profile" onClick={close}>{t('profile')}</NavLink></li>
            </>}
            {user.role === 'admin' && <>
              <li><NavLink to="/dashboard" onClick={close}>{t('dashboard')}</NavLink></li>
              <li><NavLink to="/admin"     onClick={close}>{t('adminPanel')}</NavLink></li>
            </>}
            
            {/* Notifications Dropdown */}
            <li className="lang-selector-wrap" ref={notifsRef}>
              <button className="lang-btn" onClick={handleNotifsToggle} style={{ position: 'relative' }}>
                🔔
                {unreadNotifs > 0 && <span className="nav-unread-badge" style={{ top: -5, right: -5 }}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>}
              </button>
              {notifsOpen && (
                <div className="lang-dropdown notifications-dropdown" style={{ width: 300, right: 0, padding: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-solid)' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{t('notifications')}</h4>
                    {unreadNotifs > 0 && (
                      <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                        {t('markAllRead')}
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {notifs.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <span style={{ fontSize: '2rem' }}>🔕</span>
                        <p style={{ marginTop: 8, fontSize: '0.9rem' }}>{t('noNotifications')}</p>
                      </div>
                    ) : (
                      notifs.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => markRead(n.id, n.link)}
                          style={{ 
                            padding: '12px 16px', 
                            borderBottom: '1px solid var(--border-light)',
                            background: n.is_read ? 'transparent' : 'rgba(var(--primary-rgb), 0.05)',
                            cursor: 'pointer',
                            transition: 'background var(--t-fast)'
                          }}
                        >
                          <div style={{ fontSize: '0.88rem', fontWeight: n.is_read ? 400 : 600, marginBottom: 4 }}>
                            {n.type === 'alert' ? '⚠️ ' : n.type === 'status' ? '📋 ' : '🔔 '}
                            {n.message}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(n.created_at + 'Z').toLocaleString('en-IN')}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </li>

            <li><button className="btn btn-outline btn-sm" onClick={handleLogout}>{t('logout')}</button></li>
          </>
        )}

        {/* Lang selector */}
        <li className="lang-selector-wrap" ref={langRef}>
          <button className="lang-btn" onClick={() => setLangOpen(o => !o)}>
            {currentLang.flag} {currentLang.label} ▾
          </button>
          {langOpen && (
            <div className="lang-dropdown">
              {LANGS.map(l => (
                <button key={l.code}
                  className={`lang-option${lang === l.code ? ' active' : ''}`}
                  onClick={() => handleLang(l.code)}>
                  {l.flag} {l.code === 'en' ? 'English' : l.code === 'hi' ? 'हिन्दी' : 'मराठी'}
                </button>
              ))}
            </div>
          )}
        </li>

        {/* Theme toggle */}
        <li>
          <button className="theme-toggle" onClick={toggle} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </li>
      </ul>
    </nav>
  )
}
