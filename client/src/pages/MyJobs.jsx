import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { api } from '../lib/api'
import { Spinner, EmptyState, CatBadgeSm, UrgencyLabel, Badge } from '../components/UI'
import ConfirmModal from '../components/ConfirmModal'

export default function MyJobs() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [closeTarget, setCloseTarget] = useState(null)

  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return }
    api('/api/jobs/mine').then(d => setJobs(d.jobs)).catch(() => {}).finally(() => setLoading(false))
  }, [user, authLoading, navigate])

  const closeJob = async id => {
    try {
      await api(`/api/jobs/${id}`, { method: 'PUT', body: { status: 'closed' } })
      setJobs(js => js.map(j => j.id === id ? { ...j, status: 'closed' } : j))
      toast.success(t('statusClosed') + ' ✅')
    } catch (err) { toast.error(err.message) }
  }

  if (authLoading || loading) return <div className="container"><Spinner /></div>

  return (
    <div className="container">
      <div className="feed-header">
        <h2>{t('myJobPostings')}</h2>
        <button className="btn btn-primary" onClick={() => navigate('/post-job')}>{t('postNewJobBtn')}</button>
      </div>

      {jobs.length > 0 ? (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>{t('thTitle')}</th><th>{t('thCategory')}</th><th>{t('thPay')}</th><th>{t('thUrgency')}</th><th>{t('thWorkers')}</th><th>{t('thApplicants')}</th><th>{t('thStatus')}</th><th>{t('thActions')}</th></tr>
            </thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.id}>
                  <td>
                    <strong>{j.title}</strong><br />
                    <span className="text-muted" style={{ fontSize: '0.78rem' }}>{j.location || '—'}</span>
                  </td>
                  <td><CatBadgeSm cat={j.category || 'General'} /></td>
                  <td>{j.salary || '—'}</td>
                  <td><UrgencyLabel urgency={j.urgency} /></td>
                  <td>{j.workers_needed || 1}</td>
                  <td><strong>{j.applicant_count || 0}</strong></td>
                  <td><Badge status={j.status} /></td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/applicants/${j.id}`)}>{t('viewBtn')}</button>
                      {j.status === 'active' && (
                        <button className="btn btn-sm btn-danger" onClick={() => setCloseTarget(j.id)}>{t('closeBtn')}</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title={t('noJobPostings')}
          desc={t('postJobDesc')}
          action={<button className="btn btn-primary" onClick={() => navigate('/post-job')}>{t('postJob')}</button>}
        />
      )}

      {closeTarget && (
        <ConfirmModal
          title={t('closeBtn')}
          message={t('closeJobWarning')}
          confirmLabel={t('closeBtn')}
          danger
          onConfirm={() => closeJob(closeTarget)}
          onClose={() => setCloseTarget(null)}
        />
      )}
    </div>
  )
}
