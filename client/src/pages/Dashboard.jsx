import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { api } from '../lib/api'
import { Spinner, StatCard, EmptyState, CatBadgeSm, UrgencyLabel, Badge } from '../components/UI'
import JobCard from '../components/JobCard'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import { useTheme } from '../context/ThemeContext'
import confetti from 'canvas-confetti'

/* ─── Seeker Dashboard ─────────────────────────────────────── */
function SeekerDashboard() {
  const { user } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [apps, setApps] = useState([])
  const [appliedIds, setAppliedIds] = useState([])

  useEffect(() => {
    Promise.all([api('/api/jobs'), api('/api/applications')]).then(([jd, ad]) => {
      setJobs(jd.jobs)
      setApps(ad.applications)
      setAppliedIds(ad.applications.map(a => a.job_id))
    }).catch(() => {})
  }, [])

  const handleApply = async jobId => {
    try {
      await api('/api/applications', { method: 'POST', body: { job_id: jobId } })
      setAppliedIds(ids => [...ids, jobId])
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#4CAF50', '#2E7D32', '#FFF'] })
      toast.success(t('appSubmitted'))
    } catch (err) { toast.error(err.message) }
  }

  const pending  = apps.filter(a => a.status === 'pending').length
  const accepted = apps.filter(a => a.status === 'accepted').length

  return (
    <div className="container">
      <div className="page-header">
        <h1>{t('greetingSeeker')} {user.name} 👋</h1>
        <p>{t('seekerSubtitle')} <span style={{ color: 'var(--green)' }}>{t('seekerAllSet')}</span></p>
      </div>
      <div className="stats-grid">
        <StatCard icon="💼" number={jobs.length}  label={t('jobsAvailableLabel')} color="orange" />
        <StatCard icon="📋" number={apps.length}  label={t('myAppsLabel')}        color="purple" />
        <StatCard icon="⏳" number={pending}       label={t('pendingLabel')}       color="yellow" />
        <StatCard icon="✅" number={accepted}      label={t('acceptedLabel')}      color="green"  />
      </div>
      <div className="quick-actions">
        <button className="btn btn-primary" onClick={() => navigate('/jobs')}>{t('browseAllJobs')}</button>
        <button className="btn btn-outline" onClick={() => navigate('/applications')}>{t('myApplicationsBtn')}</button>
        <button className="btn btn-ghost"   onClick={() => navigate('/profile')}>{t('editProfileBtn')}</button>
      </div>
      <div className="section-title">
        <h2>{t('latestOpportunities')}</h2>
        <Link to="/jobs" className="btn btn-ghost btn-sm">{t('viewAll')}</Link>
      </div>
      <div className="jobs-grid">
        {jobs.slice(0, 6).map(j => (
          <JobCard key={j.id} job={j} applied={appliedIds.includes(j.id)} onApply={handleApply} />
        ))}
        {jobs.length === 0 && <EmptyState title={t('noJobsYet')} desc={t('checkbackSoon')} />}
      </div>
    </div>
  )
}

/* ─── Employer Dashboard ────────────────────────────────────── */
function EmployerDashboard() {
  const { user } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])

  useEffect(() => {
    api('/api/jobs/mine').then(d => setJobs(d.jobs)).catch(() => {})
  }, [])

  const active          = jobs.filter(j => j.status === 'active').length
  const totalApplicants = jobs.reduce((s, j) => s + (j.applicant_count || 0), 0)

  return (
    <div className="container">
      <div className="page-header">
        <h1>{t('greetingEmployer')} {user.name} 🏢</h1>
        <p>{t('employerSubtitle')}</p>
      </div>
      <div className="stats-grid">
        <StatCard icon="📄" number={jobs.length}     label={t('totalPosts')}       color="orange" />
        <StatCard icon="✅" number={active}           label={t('activeJobsLabel')}  color="green"  />
        <StatCard icon="👥" number={totalApplicants} label={t('totalApplicants')}  color="purple" />
      </div>
      <div className="quick-actions">
        <button className="btn btn-primary" onClick={() => navigate('/post-job')}>{t('postNewJobBtn2')}</button>
        <button className="btn btn-outline" onClick={() => navigate('/my-jobs')}>{t('manageJobsBtn')}</button>
      </div>
      <div className="section-title"><h2>{t('recentPostings')}</h2></div>
      {jobs.length > 0 ? (
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr>
              <th>{t('thTitle')}</th><th>{t('thCategory')}</th><th>{t('thPay')}</th>
              <th>{t('thApplicants')}</th><th>{t('thStatus')}</th><th>{t('thActions')}</th>
            </tr></thead>
            <tbody>
              {jobs.slice(0, 5).map(j => (
                <tr key={j.id}>
                  <td><strong>{j.title}</strong></td>
                  <td><CatBadgeSm cat={j.category || 'General'} /></td>
                  <td>{j.salary || '—'}</td>
                  <td><strong>{j.applicant_count || 0}</strong></td>
                  <td><Badge status={j.status} /></td>
                  <td><button className="btn btn-sm btn-ghost" onClick={() => navigate(`/applicants/${j.id}`)}>{t('viewBtn2')}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title={t('noPostingsYet')} desc={t('postFirstJob')} action={<button className="btn btn-primary" onClick={() => navigate('/post-job')}>{t('postAJob')}</button>} />}
    </div>
  )
}

/* ─── Admin Dashboard ───────────────────────────────────────── */
function AdminDashboard() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [stats, setStats] = useState({})

  useEffect(() => {
    api('/api/admin/stats').then(d => setStats(d.stats)).catch(() => {})
  }, [])

  return (
    <div className="container">
      <div className="page-header"><h1>{t('adminDashTitle')}</h1><p>{t('adminDashSub')}</p></div>
      <div className="stats-grid">
        <StatCard icon="👥" number={stats.totalUsers        || 0} label={t('totalUsers')}        color="orange" />
        <StatCard icon="🔍" number={stats.totalSeekers      || 0} label={t('jobSeekers')}         color="purple" />
        <StatCard icon="🏢" number={stats.totalEmployers    || 0} label={t('employers')}          color="green"  />
        <StatCard icon="💼" number={stats.activeJobs        || 0} label={t('activeJobsLabel')}    color="yellow" />
        <StatCard icon="📋" number={stats.totalApplications || 0} label={t('totalApplications')}  color="orange" />
        <StatCard icon="✓"  number={stats.verifiedUsers     || 0} label={t('verifiedUsers')}      color="green"  />
      </div>
      <div className="quick-actions">
        <button className="btn btn-primary" onClick={() => navigate('/admin')}>{t('openAdminPanel')}</button>
      </div>
    </div>
  )
}

/* ─── Router ────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const skelBase = theme === 'dark' ? '#2d2d2d' : '#f0f0f0'
  const skelHigh = theme === 'dark' ? '#3d3d3d' : '#ffffff'

  useEffect(() => { if (!loading && !user) navigate('/login') }, [user, loading, navigate])

  if (loading || !user) return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <SkeletonTheme baseColor={skelBase} highlightColor={skelHigh}>
        <Skeleton width={200} height={32} style={{ marginBottom: 12 }} />
        <Skeleton width="60%" height={24} style={{ marginBottom: 32 }} />
        <div className="stats-grid">
           {[1,2,3,4].map(i => <Skeleton key={i} height={100} borderRadius={16} />)}
        </div>
      </SkeletonTheme>
    </div>
  )
  if (user.role === 'seeker')   return <SeekerDashboard />
  if (user.role === 'employer') return <EmployerDashboard />
  return <AdminDashboard />
}
