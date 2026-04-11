import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { api } from '../lib/api'
import { Spinner, EmptyState, CatBadgeSm } from '../components/UI'
import { StarPicker } from '../components/RatingStars'
import WhatsAppBtn from '../components/WhatsAppBtn'

function RateModal({ seeker, jobId, jobTitle, onClose, onDone }) {
  const { t } = useLang()
  const [stars, setStars]   = useState(0)
  const [review, setReview] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!stars) { toast.error('Please select a star rating'); return }
    setSaving(true)
    try {
      await api('/api/ratings', { method: 'POST', body: { seeker_id: seeker.user_id || seeker.id, job_id: jobId, stars, review } })
      toast.success('Rating submitted! ⭐')
      onDone()
      onClose()
    } catch (err) { toast.error(err.message) }
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⭐ {t('rateWorker')}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ marginBottom: 12 }}>Rating <strong>{seeker.name}</strong> for "<em>{jobTitle}</em>"</p>
        <StarPicker value={stars} onChange={setStars} />
        <textarea className="form-textarea mt-2" placeholder={t('addReview')}
          value={review} onChange={e => setReview(e.target.value)} rows={3} />
        <div className="flex gap-1 mt-3">
          <button className="btn btn-primary" onClick={submit} disabled={saving || !stars}>
            {saving ? t('loading') : t('submitRating')}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>{t('close')}</button>
        </div>
      </div>
    </div>
  )
}

function DeclineModal({ seeker, onClose, onConfirm }) {
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
          <h3>{t('declineAppHeading')}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ marginBottom: 12 }}>Please provide a reason for declining <strong>{seeker.name}</strong>. They will see this reason.</p>
        <textarea className="form-textarea" placeholder="e.g. Distance too far, found someone else..."
          value={reason} onChange={e => setReason(e.target.value)} rows={3} />
        <div className="flex gap-1 mt-3">
          <button className="btn btn-danger" onClick={submit} disabled={saving || !reason.trim()}>
            {saving ? t('loading') : t('reject')}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>{t('close')}</button>
        </div>
      </div>
    </div>
  )
}

export default function Applicants() {
  const { id: jobId } = useParams()
  const { user, loading: authLoading } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [job, setJob]               = useState(null)
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading]       = useState(true)
  const [rateTarget, setRateTarget] = useState(null)
  const [declineTarget, setDeclineTarget] = useState(null)

  const load = () => {
    Promise.all([
      api(`/api/jobs/${jobId}`),
      api(`/api/jobs/${jobId}/applicants`)
    ]).then(([jd, ad]) => {
      setJob(jd.job)
      setApplicants(ad.applicants)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return }
    load()
  }, [jobId, user, authLoading, navigate])

  const acceptApp = async (appId) => {
    try {
      await api(`/api/applications/${appId}`, { method: 'PUT', body: { status: 'accepted' } })
      toast.success('✅ Accepted! You can now view their contact details.')
      load() // reload to get scrubbed contact info back
    } catch (err) { toast.error(err.message) }
  }

  const declineApp = async (appId, reason) => {
    try {
      await api(`/api/applications/${appId}`, { method: 'PUT', body: { status: 'rejected', decline_reason: reason } })
      toast.success('❌ Application rejected.')
      setDeclineTarget(null)
      load()
    } catch (err) { toast.error(err.message) }
  }

  const approveCancel = async (appId) => {
    try {
      await api(`/api/applications/${appId}/approve-cancel`, { method: 'PUT' })
      toast.success('Cancellation approved.')
      load()
    } catch (err) { toast.error(err.message) }
  }

  if (authLoading || loading) return <div className="container"><Spinner /></div>

  return (
    <div className="container">
      <button className="btn btn-ghost mb-2" onClick={() => navigate('/my-jobs')}>
        {t('backToJobs')}
      </button>

      {job && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2>{job.title}</h2>
              <p className="text-muted">{applicants.length} applicant(s) · {job.location || 'No location'}</p>
            </div>
            <CatBadgeSm cat={job.category || 'General'} />
          </div>
        </div>
      )}

      {applicants.length > 0 ? applicants.map(a => (
        <div key={a.id} className="applicant-card">
          {/* Avatar */}
          <div className="applicant-avatar-wrap" onClick={() => navigate(`/worker/${a.user_id || a.id}`)}>
            {a.avatar_url
              ? <img src={a.avatar_url} alt={a.name} className="applicant-avatar-img" />
              : <div className="applicant-avatar">{(a.name || 'U')[0]}</div>
            }
          </div>

          <div className="applicant-info">
            <h4>
              <button className="link-btn" onClick={() => navigate(`/worker/${a.user_id || a.id}`)}>
                {a.name}
              </button>
              <span className={`badge badge-${a.status}`} style={{ marginLeft: 8 }}>
                {a.status === 'cancel_requested' ? t('waitApproveCancel') : (a.status === 'pending' ? t('statusPending') : (a.status === 'accepted' ? t('statusAccepted') : (a.status === 'rejected' ? t('statusRejected') : a.status)))}
              </span>
              {a.verified && <span className="badge badge-verified" style={{ marginLeft: 4 }}>{t('verified')}</span>}
            </h4>

            {a.status === 'accepted' ? (
              <p>{a.email || 'No email'}{a.contact_phone ? ` · 📞 ${a.contact_phone}` : ''}</p>
            ) : (
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                🔒 Contact info hidden until accepted.
              </p>
            )}

            {a.skills && <p style={{ marginTop: 4 }}>🛠️ {a.skills}</p>}
            {a.location && <p>📍 {a.location}</p>}
            {a.languages && <p>🗣️ {a.languages}</p>}
            {a.daily_rate && <p>💰 {a.daily_rate}</p>}
            {a.bio && <p className="applicant-bio">"{a.bio.slice(0, 120)}{a.bio.length > 120 ? '…' : ''}"</p>}

            {a.status === 'rejected' && a.decline_reason && (
              <div className="mt-2 text-danger" style={{ fontSize: '0.8rem', padding: '8px', background: 'rgba(220, 38, 38, 0.1)', borderRadius: '8px' }}>
                <strong>{t('declineReason')}:</strong> {a.decline_reason}
              </div>
            )}

            {a.status === 'cancel_requested' && a.cancel_reason && (
              <div className="mt-2 text-primary" style={{ fontSize: '0.8rem', padding: '8px', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '8px' }}>
                <strong>{t('cancelReason')}:</strong> {a.cancel_reason}
              </div>
            )}

            {(() => {
              try {
                const port = JSON.parse(a.portfolio || '[]');
                const images = port.filter(p => p.image_url);
                if (images.length === 0) return null;
                return (
                  <div style={{ marginTop: 12 }}>
                    <strong>Work Gallery:</strong>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, overflowX: 'auto', paddingBottom: 4 }}>
                      {images.map((img, idx) => (
                        <div key={idx} style={{ flexShrink: 0 }}>
                          <img src={img.image_url} alt={img.title} title={`${img.title} - ${img.desc}`} 
                            style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                          <div style={{ fontSize: '0.7rem', marginTop: 4, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              } catch (e) { return null }
            })()}

            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/worker/${a.user_id || a.id}`)}>
                👤 {t('viewProfile')}
              </button>
              
              {a.status === 'accepted' && (
                <>
                  <button className="btn btn-sm btn-outline"
                    onClick={() => navigate(`/messages?to=${a.user_id || a.id}`)}>
                    💬 {t('messages')}
                  </button>
                  {a.whatsapp && <WhatsAppBtn number={a.whatsapp} name={a.name} jobTitle={job?.title} size="sm" />}
                </>
              )}
            </div>
          </div>

          <div className="applicant-actions">
            {a.status === 'pending' && <>
              <button className="btn btn-sm btn-success" onClick={() => acceptApp(a.id)}>✓ {t('accept')}</button>
              <button className="btn btn-sm btn-danger"  onClick={() => setDeclineTarget(a)}>✕ {t('reject')}</button>
            </>}
            {a.status === 'accepted' && (
              <>
                <button className="btn btn-sm btn-outline" onClick={() => setRateTarget(a)}>⭐ {t('rateWorker')}</button>
                <button className="btn btn-sm btn-danger mt-2" onClick={() => setDeclineTarget(a)}>✕ {t('reject')}</button>
              </>
            )}
            {a.status === 'cancel_requested' && (
              <button className="btn btn-sm btn-danger" onClick={() => approveCancel(a.id)}>{t('approveCancel')}</button>
            )}
            {a.status === 'cancelled' && (
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>Cancelled</span>
            )}
            {a.status === 'withdrawn' && (
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>Withdrawn</span>
            )}
          </div>
        </div>
      )) : <EmptyState title="No applicants yet" desc="Once workers apply, they will appear here." />}

      {/* Rate Modal */}
      {rateTarget && job && (
        <RateModal
          seeker={rateTarget}
          jobId={jobId}
          jobTitle={job.title}
          onClose={() => setRateTarget(null)}
          onDone={load}
        />
      )}

      {/* Decline Modal */}
      {declineTarget && (
        <DeclineModal
          seeker={declineTarget}
          onClose={() => setDeclineTarget(null)}
          onConfirm={(reason) => declineApp(declineTarget.id, reason)}
        />
      )}
    </div>
  )
}
