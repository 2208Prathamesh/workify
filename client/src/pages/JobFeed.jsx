import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { useTheme } from '../context/ThemeContext'
import { api } from '../lib/api'
import confetti from 'canvas-confetti'
import { Spinner } from '../components/UI'
import JobCard from '../components/JobCard'
import { JOB_CATEGORIES } from '../lib/constants'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'

export default function JobFeed() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useLang()
  const { theme } = useTheme()
  const navigate = useNavigate()

  const [jobs, setJobs]             = useState([])
  const [appliedIds, setAppliedIds] = useState([])
  const [loadingData, setLoading]   = useState(true)
  const [search, setSearch]         = useState('')
  const [location, setLocation]     = useState('')
  const [category, setCategory]     = useState('All')
  const [urgencyOnly, setUrgency]   = useState(false)

  const skelBase = theme === 'dark' ? '#2d2d2d' : '#f0f0f0'
  const skelHigh = theme === 'dark' ? '#3d3d3d' : '#ffffff'

  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return }
    Promise.all([
      api('/api/jobs'),
      user?.role === 'seeker' ? api('/api/applications') : Promise.resolve({ applications: [] })
    ]).then(([jd, ad]) => {
      setJobs(jd.jobs)
      setAppliedIds((ad.applications || []).map(a => a.job_id))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user, authLoading, navigate])

  const filtered = useMemo(() => jobs.filter(j => {
    const q  = search.toLowerCase()
    const lo = location.toLowerCase()
    return (category === 'All' || (j.category || 'General') === category)
        && (!urgencyOnly || j.urgency === 'today')
        && (!q  || j.title.toLowerCase().includes(q) || (j.description || '').toLowerCase().includes(q) || (j.skills_required || '').toLowerCase().includes(q))
        && (!lo || (j.location || '').toLowerCase().includes(lo))
  }), [jobs, category, urgencyOnly, search, location])

  const handleApply = async jobId => {
    if (!window.confirm(t('confirmApply'))) return;
    try {
      await api('/api/applications', { method: 'POST', body: { job_id: jobId } })
      setAppliedIds(ids => [...ids, jobId])
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4CAF50', '#2E7D32', '#FFF']
      })
      toast.success(t('appSubmitted'))
    } catch (err) { toast.error(err.message) }
  }

  if (authLoading || loadingData) return (
    <div className="container">
      <SkeletonTheme baseColor={skelBase} highlightColor={skelHigh}>
        <div className="feed-header">
          <Skeleton width={200} height={32} />
          <Skeleton width={120} height={20} />
        </div>
        <div className="search-row">
          <Skeleton height={42} style={{ flex: 1 }} />
          <Skeleton height={42} width={180} />
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[1,2,3,4].map(i => <Skeleton key={i} width={80} height={32} borderRadius={16} />)}
        </div>
        <div className="jobs-grid">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="job-card" style={{ height: '240px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Skeleton width={100} height={24} borderRadius={12} />
                <Skeleton width={80} height={24} borderRadius={12} />
              </div>
              <Skeleton width="80%" height={24} style={{ marginBottom: 8 }} />
              <Skeleton width={120} height={16} style={{ marginBottom: 16 }} />
              <Skeleton count={2} style={{ marginBottom: 16 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <Skeleton width={60} height={24} borderRadius={12} />
                <Skeleton width={80} height={24} borderRadius={12} />
              </div>
            </div>
          ))}
        </div>
      </SkeletonTheme>
    </div>
  )

  return (
    <div className="container">
      <div className="feed-header">
        <h2>{t('findNextJob')}</h2>
        <span className="text-muted">{jobs.length} {t('jobsAvailable')}</span>
      </div>

      {/* Search */}
      <div className="search-row">
        <input className="form-input" placeholder={t('searchPlaceholder')}
          value={search} onChange={e => setSearch(e.target.value)} />
        <input className="form-input" placeholder={t('locationPlaceholder')} style={{ maxWidth: 180 }}
          value={location} onChange={e => setLocation(e.target.value)} />
      </div>

      {/* Category pills */}
      <div className="filter-pills">
        {JOB_CATEGORIES.map(c => (
          <div key={c.id}
            className={`filter-pill${category === c.id ? ' active' : ''}`}
            onClick={() => setCategory(c.id)}>
            {c.icon} {t(`cat${c.id}`)}
          </div>
        ))}
        <div className={`urgency-toggle${urgencyOnly ? ' active' : ''}`} onClick={() => setUrgency(u => !u)}>
          <span className="pulse-dot" /> {t('hiringToday')}
        </div>
      </div>

      {/* Grid */}
      <div className="jobs-grid">
        {filtered.length > 0
          ? filtered.map(j => (
              <JobCard key={j.id} job={j} applied={appliedIds.includes(j.id)} onApply={handleApply} />
            ))
          : <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="empty-icon">🔍</div>
              <h3>{t('noMatchingJobs')}</h3>
              <p>{t('tryAdjustingFilters')}</p>
            </div>
        }
      </div>
    </div>
  )
}
