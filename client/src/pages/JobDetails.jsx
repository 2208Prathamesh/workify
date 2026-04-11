import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../lib/api'
import JobCard from '../components/JobCard'
import { Spinner } from '../components/UI'

export default function JobDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    Promise.all([
      api(`/api/jobs/${id}`),
      api('/api/applications').catch(() => ({ applications: [] })) // Handle if not logged in
    ])
    .then(([jobRes, appRes]) => {
      setJob(jobRes.job)
      const isApplied = (appRes.applications || []).some(a => a.job_id === parseInt(id))
      setApplied(isApplied)
    })
    .catch((err) => {
      if (err.message.includes('404')) toast.error('Job not found or removed.')
    })
    .finally(() => setLoading(false))
  }, [id])

  const handleApply = async jobId => {
    if (!window.confirm('Are you sure you want to apply for this job?')) return
    try {
      await api('/api/applications', { method: 'POST', body: { job_id: jobId } })
      setApplied(true)
      toast.success('Application submitted successfully! 🎉')
      navigate('/applications')
    } catch (err) {
      if (err.message.includes('401')) {
        toast.error('Please login to apply.')
        navigate('/login')
      } else {
        toast.error(err.message)
      }
    }
  }

  if (loading) return <div className="container" style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}><Spinner /></div>

  if (!job) return (
    <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>
      <div style={{ fontSize: '4rem', marginBottom: 20 }}>🕵️</div>
      <h2>Job Not Found</h2>
      <p className="text-muted" style={{ margin: '12px 0 24px' }}>This job might have been removed or closed by the employer.</p>
      <button className="btn btn-primary" onClick={() => navigate('/jobs')}>← Browse More Jobs</button>
    </div>
  )

  return (
    <div className="container" style={{ maxWidth: '600px', margin: '0 auto', marginTop: '20px' }}>
      <button className="btn btn-ghost mb-3" onClick={() => navigate('/jobs')}>
        ← Back to Jobs
      </button>
      <JobCard job={job} applied={applied} onApply={handleApply} />
    </div>
  )
}
