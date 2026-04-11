import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { api } from '../lib/api'
import { Spinner, CatBadgeSm, UrgencyLabel, Badge } from '../components/UI'
import ConfirmModal from '../components/ConfirmModal'

const TABS = ['users', 'jobs', 'smtp', 'mail']

export default function Admin() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [tab, setTab] = useState('users')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) { navigate('/dashboard'); return }
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    setData(null)
    const routes = { users: '/api/admin/users', jobs: '/api/admin/jobs', smtp: '/api/admin/smtp', mail: null }
    if (!routes[tab]) { setLoading(false); return }
    api(routes[tab]).then(d => setData(d)).catch(() => {}).finally(() => setLoading(false))
  }, [tab, user])

  if (authLoading) return <div className="container"><Spinner /></div>
  if (!user || user.role !== 'admin') return null

  const tabLabels = {
    users: t('tabUsers'),
    jobs:  t('tabJobs'),
    smtp:  t('tabSmtp'),
    mail:  t('tabMail'),
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>{t('adminTitle')}</h1>
        <p>{t('adminSubtitle')}</p>
      </div>

      <div className="admin-tabs">
        {TABS.map(tb => (
          <button key={tb} className={`admin-tab${tab === tb ? ' active' : ''}`} onClick={() => setTab(tb)}>
            {tabLabels[tb]}
          </button>
        ))}
      </div>

      {tab === 'mail' ? (
        <MailTab />
      ) : loading ? <Spinner /> : (
        <div className="admin-section">
          {tab === 'users' && <UsersTab users={data?.users || []} reload={() => setTab(t => { setData(null); return t })} />}
          {tab === 'jobs'  && <JobsTab  jobs={data?.jobs   || []} reload={() => setTab(t => { setData(null); return t })} />}
          {tab === 'smtp'  && <SmtpTab  settings={data?.settings || {}} />}
        </div>
      )}
    </div>
  )
}

/* ─── Users Tab ────────────────────────────────────────────────── */
function UsersTab({ users, reload }) {
  const { t } = useLang()
  const [confirmTarget, setConfirmTarget] = useState(null)

  const toggleVerify = async (id, verified) => {
    try {
      await api(`/api/admin/users/${id}/verify`, { method: 'PUT', body: { verified } })
      toast.success(verified ? `${t('verifyBtn')} ✅` : t('unverifyBtn'))
      reload()
    } catch (err) { toast.error(err.message) }
  }

  const deleteUser = async id => {
    try {
      await api(`/api/admin/users/${id}`, { method: 'DELETE' })
      toast.success(t('deleteBtn') + ' ✓')
      reload()
    } catch (err) { toast.error(err.message) }
  }

  return (
    <>
      <p className="text-muted mb-2">{users.length} {t('totalUsersCount')}</p>
      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr>
            <th>{t('nameLabel')}</th>
            <th>{t('emailLabel')}</th>
            <th>{t('roleLabel')}</th>
            <th>{t('verifiedLabel')}</th>
            <th>{t('actionsLabel')}</th>
          </tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong></td>
                <td>{u.email}</td>
                <td><Badge status={u.role} /></td>
                <td>{u.verified
                    ? <span className="badge badge-verified">✓ {t('verifiedLabel')}</span>
                    : <span className="badge badge-unverified">No</span>}
                </td>
                <td>
                  {u.role !== 'admin' && (
                    <div className="flex gap-1">
                      <button className={`btn btn-sm ${u.verified ? 'btn-ghost' : 'btn-success'}`}
                        onClick={() => toggleVerify(u.id, !u.verified)}>
                        {u.verified ? t('unverifyBtn') : t('verifyBtn')}
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => setConfirmTarget(u)}>
                        {t('deleteBtn')}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {confirmTarget && (
        <ConfirmModal
          title={t('deleteBtn') + ' ' + confirmTarget.name}
          message={t('confirmDeleteUser')}
          confirmLabel={t('deleteBtn')}
          danger
          onConfirm={() => deleteUser(confirmTarget.id)}
          onClose={() => setConfirmTarget(null)}
        />
      )}
    </>
  )
}

/* ─── Jobs Tab ─────────────────────────────────────────────────── */
function JobsTab({ jobs, reload }) {
  const { t } = useLang()
  const [confirmTarget, setConfirmTarget] = useState(null)

  const removeJob = async id => {
    try {
      await api(`/api/admin/jobs/${id}`, { method: 'DELETE' })
      toast.success(t('removedLabel') + ' ✓')
      reload()
    } catch (err) { toast.error(err.message) }
  }

  return (
    <>
      <p className="text-muted mb-2">{jobs.length} {t('totalJobsCount')}</p>
      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr>
            <th>{t('thTitle')}</th>
            <th>Employer</th>
            <th>{t('categoryLabel')}</th>
            <th>{t('urgencyLabel')}</th>
            <th>{t('applicantsLabel')}</th>
            <th>{t('statusLabel')}</th>
            <th>{t('actionsLabel')}</th>
          </tr></thead>
          <tbody>
            {jobs.map(j => (
              <tr key={j.id}>
                <td><strong>{j.title}</strong></td>
                <td>{j.employer_name}</td>
                <td><CatBadgeSm cat={j.category || 'General'} /></td>
                <td><UrgencyLabel urgency={j.urgency} /></td>
                <td>{j.applicant_count || 0}</td>
                <td><Badge status={j.status} /></td>
                <td>
                  {j.status !== 'removed'
                    ? <button className="btn btn-sm btn-danger" onClick={() => setConfirmTarget(j)}>{t('removeBtn')}</button>
                    : <span className="text-muted">{t('removedLabel')}</span>}
                </td>
              </tr>
            ))}
            {jobs.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>{t('noJobsFound')}</td></tr>}
          </tbody>
        </table>
      </div>
      {confirmTarget && (
        <ConfirmModal
          title={t('removeBtn') + ': ' + confirmTarget.title}
          message={t('confirmRemoveJob')}
          confirmLabel={t('removeBtn')}
          danger
          onConfirm={() => removeJob(confirmTarget.id)}
          onClose={() => setConfirmTarget(null)}
        />
      )}
    </>
  )
}

/* ─── SMTP Tab ─────────────────────────────────────────────────── */
function SmtpTab({ settings: init }) {
  const { t } = useLang()
  const [form, setForm] = useState({
    host: init.host || '', port: init.port || 587,
    username: init.username || '', password: init.password || '',
    sender_name: init.sender_name || 'Workify', sender_email: init.sender_email || '',
    secure: !!init.secure,
  })
  const [saving, setSaving] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testing, setTesting] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async e => {
    e.preventDefault(); setSaving(true)
    try { await api('/api/admin/smtp', { method: 'PUT', body: form }); toast.success(t('saveSettings') + ' ✅') }
    catch (err) { toast.error(err.message) }
    setSaving(false)
  }

  const test = async () => {
    if (!testEmail) { toast.error('Enter a test email address first'); return }
    setTesting(true)
    try {
      const result = await api('/api/admin/smtp/test', { method: 'POST', body: { test_email: testEmail } })
      toast.success(t('emailSentSuccess'))
      if (result.previewUrl) {
        toast((tb) => (
          <span>{t('previewUrlLabel')} <a href={result.previewUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Open →</a></span>
        ), { duration: 8000, icon: '🔗' })
      }
    } catch (err) { toast.error(err.message) }
    setTesting(false)
  }

  return (
    <div className="glass-card" style={{ padding: 36, maxWidth: 600 }}>
      <h3 className="mb-2">{t('smtpTitle')}</h3>
      <p className="text-muted mb-3">{t('smtpSubtitle')}</p>
      <form onSubmit={save}>
        <div className="form-row">
          <div className="form-group"><label>{t('smtpHost')}</label>
            <input className="form-input" placeholder="smtp.gmail.com" value={form.host} onChange={e => set('host', e.target.value)} /></div>
          <div className="form-group"><label>{t('smtpPort')}</label>
            <input type="number" className="form-input" value={form.port} onChange={e => set('port', +e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>{t('smtpUser')}</label>
            <input className="form-input" placeholder="your@email.com" value={form.username} onChange={e => set('username', e.target.value)} /></div>
          <div className="form-group"><label>{t('smtpPass')}</label>
            <input type="password" className="form-input" placeholder={t('smtpAppPass')} value={form.password} onChange={e => set('password', e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>{t('senderName')}</label>
            <input className="form-input" value={form.sender_name} onChange={e => set('sender_name', e.target.value)} /></div>
          <div className="form-group"><label>{t('senderEmail')}</label>
            <input className="form-input" value={form.sender_email} onChange={e => set('sender_email', e.target.value)} /></div>
        </div>
        <label className="form-check mb-3">
          <input type="checkbox" checked={form.secure} onChange={e => set('secure', e.target.checked)} />
          {t('useSSL')}
        </label>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('saving') : t('saveSettings')}</button>
      </form>

      {/* Test Email — Inline, no prompt() */}
      <div style={{ marginTop: 24, padding: '20px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)' }}>
        <h4 className="mb-2">📤 {t('sendTestEmail')}</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="email"
            className="form-input"
            placeholder="test@example.com"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="button" className="btn btn-outline" onClick={test} disabled={testing || !testEmail}>
            {testing ? t('sending') : t('sendTestEmail')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Mail Center Tab ──────────────────────────────────────────── */
const MAIL_TEMPLATES = {
  welcome: {
    subject: 'Welcome to Workify! 🎉',
    body: `<h2 style="color:#4CAF50">Welcome to Workify! 🎉</h2>
<p>Hi <strong>{{name}}</strong>,</p>
<p>We're thrilled to have you on board. Workify is here to help you find great work opportunities with no resume or degree needed.</p>
<p>Here's what you can do right now:</p>
<ul>
  <li>✅ Complete your profile to stand out</li>
  <li>💼 Browse available jobs in your area</li>
  <li>📞 Connect with employers directly</li>
</ul>
<p>Welcome aboard!</p>
<p><strong>— The Workify Team</strong></p>`,
  },
  verified: {
    subject: '✅ Your Account is Now Verified — Workify',
    body: `<h2 style="color:#4CAF50">🎉 You're Verified!</h2>
<p>Hi <strong>{{name}}</strong>,</p>
<p>Great news! Your Workify account has been <strong>verified</strong> by our admin team. You now have a <strong>✓ Verified</strong> badge on your profile, which helps employers trust you more.</p>
<p>Keep applying and best of luck finding great opportunities!</p>
<p><strong>— The Workify Team</strong></p>`,
  },
  job_alert: {
    subject: '💼 New Jobs Available Near You — Workify',
    body: `<h2 style="color:#4CAF50">💼 New Jobs Are Waiting</h2>
<p>Hi <strong>{{name}}</strong>,</p>
<p>There are new job openings that match your profile. Act fast — these fill up quickly!</p>
<p>Log in to Workify now to see all available jobs and apply instantly.</p>
<p><a href="{{url}}" style="background:#4CAF50;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">View Jobs →</a></p>
<p><strong>— The Workify Team</strong></p>`,
  },
  warning: {
    subject: '⚠️ Important Notice from Workify Admin',
    body: `<h2 style="color:#f59e0b">⚠️ Platform Notice</h2>
<p>Hi <strong>{{name}}</strong>,</p>
<p>This is an important message from the Workify admin team:</p>
<blockquote style="border-left:4px solid #f59e0b;padding:12px;background:#fef3c7">
  {{message}}
</blockquote>
<p>If you have any questions, please reply to this email.</p>
<p><strong>— The Workify Admin Team</strong></p>`,
  },
  custom: {
    subject: '',
    body: '',
  },
}

function MailTab() {
  const { t } = useLang()
  const [template, setTemplate] = useState('welcome')
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState(MAIL_TEMPLATES.welcome.subject)
  const [body, setBody] = useState(MAIL_TEMPLATES.welcome.body)
  const [showPreview, setShowPreview] = useState(false)
  const [sending, setSending] = useState(false)

  const selectTemplate = (key) => {
    setTemplate(key)
    setSubject(MAIL_TEMPLATES[key].subject)
    setBody(MAIL_TEMPLATES[key].body)
    setShowPreview(false)
  }

  const send = async () => {
    if (!to) { toast.error('Enter a recipient email'); return }
    if (!subject) { toast.error('Subject cannot be empty'); return }
    if (!body) { toast.error('Email body cannot be empty'); return }
    setSending(true)
    try {
      const result = await api('/api/admin/mail/send', {
        method: 'POST',
        body: { to, subject, html: body }
      })
      toast.success(t('emailSentSuccess'))
      if (result.previewUrl) {
        toast((tb) => (
          <span>{t('previewUrlLabel')} <a href={result.previewUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Open →</a></span>
        ), { duration: 10000, icon: '🔗' })
      }
    } catch (err) { toast.error(err.message) }
    setSending(false)
  }

  const templateKeys = Object.keys(MAIL_TEMPLATES)
  const templateLabel = {
    welcome:  t('templateWelcome'),
    verified: t('templateVerified'),
    job_alert:t('templateJobAlert'),
    warning:  t('templateWarning'),
    custom:   t('templateCustom'),
  }

  return (
    <div className="glass-card" style={{ padding: 36, maxWidth: 780 }}>
      <h3 className="mb-1">{t('mailCenterTitle')}</h3>
      <p className="text-muted mb-4">{t('mailCenterSub')}</p>

      {/* Template Picker */}
      <div className="form-group">
        <label>{t('selectTemplate')}</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {templateKeys.map(key => (
            <button
              key={key}
              type="button"
              className={`btn btn-sm ${template === key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => selectTemplate(key)}
            >
              {templateLabel[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Recipient */}
      <div className="form-group">
        <label>{t('recipient')}</label>
        <input
          type="email"
          className="form-input"
          placeholder="user@example.com"
          value={to}
          onChange={e => setTo(e.target.value)}
        />
      </div>

      {/* Subject */}
      <div className="form-group">
        <label>{t('emailSubject')}</label>
        <input
          className="form-input"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Email subject…"
        />
      </div>

      {/* Body Editor / Preview Toggle */}
      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ marginBottom: 0 }}>{t('emailBody')}</label>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowPreview(p => !p)}
          >
            {showPreview ? `✏️ ${t('editEmail')}` : `👁️ ${t('previewEmail')}`}
          </button>
        </div>

        {showPreview ? (
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 24,
              minHeight: 260,
              background: '#fff',
              color: '#333',
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
              lineHeight: 1.6,
            }}
            dangerouslySetInnerHTML={{ __html: body }}
          />
        ) : (
          <textarea
            className="form-textarea"
            style={{ fontFamily: 'monospace', fontSize: '0.85rem', minHeight: 260 }}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write your email HTML here…"
            rows={12}
          />
        )}
        <div className="hint" style={{ marginTop: 6 }}>
          💡 Variables: <code>{'{{name}}'}</code>, <code>{'{{url}}'}</code>, <code>{'{{message}}'}</code>
        </div>
      </div>

      {/* Send */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={send}
          disabled={sending || !to || !subject || !body}
        >
          {sending ? t('sending') : `📨 ${t('sendEmail')}`}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setShowPreview(p => !p)}
        >
          {showPreview ? `✏️ ${t('editEmail')}` : `👁️ ${t('previewEmail')}`}
        </button>
      </div>
    </div>
  )
}
