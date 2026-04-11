import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { api } from '../lib/api'
import { Spinner, EmptyState } from '../components/UI'
import { getCatEmoji, timeAgo } from '../lib/constants'
import ConfirmModal from '../components/ConfirmModal'

const STATUS_LABEL = (t, status) => {
  const map = {
    pending:          t('statusPending'),
    accepted:         t('statusAccepted'),
    rejected:         t('statusRejected'),
    withdrawn:        t('statusWithdrawn'),
    cancelled:        t('statusCancelled'),
    cancel_requested: t('waitApproveCancel'),
  }
  return map[status] || status
}

function CancelModal({ onClose, onConfirm }) {
  const { t } = useLang()
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!reason.trim()) { toast.error('Please provide a reason'); return }
    setSaving(true)
    await onConfirm(reason)
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Request Cancellation</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ marginBottom: 12 }}>You have already been accepted for this job. If you can no longer attend, please provide a reason. The employer must approve your cancellation.</p>
        <textarea className="form-textarea" placeholder={t('cancelReasonPrompt')}
          value={reason} onChange={e => setReason(e.target.value)} rows={3} />
        <div className="flex gap-1 mt-3">
          <button className="btn btn-primary" onClick={submit} disabled={saving || !reason.trim()}>
            {saving ? t('loading') : t('submitCancel')}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>{t('close')}</button>
        </div>
      </div>
    </div>
  )
}

export default function Applications() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [withdrawTarget, setWithdrawTarget] = useState(null)

  const load = () => {
    api('/api/applications')
      .then(d => setApps(d.applications))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return }
    load()
  }, [user, authLoading, navigate])

  const withdraw = async (appId) => {
    try {
      await api(`/api/applications/${appId}`, { method: 'DELETE' })
      toast.success(t('statusWithdrawn') + '.', { icon: '🗑️' })
      load()
    } catch (err) { toast.error(err.message) }
  }

  const cancelRequest = async (appId, reason) => {
    try {
      await api(`/api/applications/${appId}/cancel`, { method: 'POST', body: { cancel_reason: reason } })
      toast.success('Cancellation request sent to employer.')
      setCancelTarget(null)
      load()
    } catch (err) { toast.error(err.message) }
  }

  if (authLoading || loading) return <div className="container"><Spinner /></div>

  return (
    <div className="container">
      <div className="page-header">
        <h1>{t('applications')}</h1>
        <p className="text-muted">{apps.length} {t('appCountLabel')}</p>
      </div>

      {apps.length > 0 ? apps.map(a => (
        <div key={a.id} className="application-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="app-icon">{getCatEmoji(a.category)}</div>
              <div className="app-info">
                <h4>{a.job_title}</h4>
                <p>
                  🏢 {a.employer_name}
                  {a.job_location ? ` · 📍 ${a.job_location}` : ''}
                  {a.salary       ? ` · 💰 ${a.salary}` : ''}
                </p>
              </div>
            </div>
            <div className="app-meta" style={{ textAlign: 'right' }}>
              <span className={`badge badge-${a.status}`}>
                {STATUS_LABEL(t, a.status)}
              </span>
              <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '4px' }}>{timeAgo(a.created_at)}</div>
            </div>
          </div>

          {a.status === 'rejected' && a.decline_reason && (
            <div className="text-danger" style={{ fontSize: '0.85rem', padding: '8px', background: 'rgba(220, 38, 38, 0.1)', borderRadius: '8px' }}>
              <strong>{t('declineReason')}:</strong> {a.decline_reason}
            </div>
          )}

          {a.status === 'cancel_requested' && (
            <div className="text-primary" style={{ fontSize: '0.85rem', padding: '8px', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '8px' }}>
              {t('reqCancelWait')}
            </div>
          )}

          {a.status === 'accepted' && (
            <div className="mt-2" style={{ fontSize: '0.85rem', padding: '8px', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <strong>{t('employerContact')}</strong>
              <div style={{ marginTop: '4px' }}>
                {a.employer_email    && <div>✉️ {a.employer_email}</div>}
                {a.employer_phone    && <div>📞 {a.employer_phone}</div>}
                {a.employer_whatsapp && <div>💬 WhatsApp: {a.employer_whatsapp}</div>}
                {!a.employer_email && !a.employer_phone && !a.employer_whatsapp && (
                  <span className="text-muted">{t('noContactInfo')}</span>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            {a.status === 'pending' && (
              <button className="btn btn-sm btn-ghost" onClick={() => setWithdrawTarget(a)}>
                {t('withdrawApp')}
              </button>
            )}
            {a.status === 'accepted' && (
              <button className="btn btn-sm btn-outline" onClick={() => setCancelTarget(a)}>
                {t('requestCancel')}
              </button>
            )}
          </div>
        </div>
      )) : (
        <EmptyState
          title={t('noResults')}
          desc="Browse jobs and click 'I'm Interested' to start applying!"
          action={<button className="btn btn-primary" onClick={() => navigate('/jobs')}>🔍 {t('findJobs')}</button>}
        />
      )}

      {apps.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button className="btn btn-primary" onClick={() => navigate('/jobs')}>{t('browseMoreJobs')}</button>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelTarget && (
        <CancelModal
          onClose={() => setCancelTarget(null)}
          onConfirm={(reason) => cancelRequest(cancelTarget.id, reason)}
        />
      )}

      {/* Withdraw Confirm Modal */}
      {withdrawTarget && (
        <ConfirmModal
          title={t('withdrawApp')}
          message={t('withdrawConfirm')}
          confirmLabel={t('withdrawApp')}
          danger
          onConfirm={() => withdraw(withdrawTarget.id)}
          onClose={() => setWithdrawTarget(null)}
        />
      )}
    </div>
  )
}
