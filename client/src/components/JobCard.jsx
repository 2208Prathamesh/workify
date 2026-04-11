import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { getCatStyle, timeAgo } from '../lib/constants'
import { api } from '../lib/api'
import html2canvas from 'html2canvas'

export function CatBadge({ cat }) {
  const s = getCatStyle(cat)
  return <span className={`job-cat-badge ${s.cls}`}>{s.icon} {cat || 'General'}</span>
}

export function UrgencyBadge({ urgency }) {
  const { t } = useLang()
  if (urgency === 'today')
    return <span className="urgency-badge urgency-today"><span className="pulse-dot" /> {t('hiringToday')}</span>
  if (urgency === 'week')
    return <span className="urgency-badge urgency-week">🟡 {t('thisWeek')}</span>
  return null
}

export default function JobCard({ job, applied = false, onApply, initialSaved = false }) {
  const { user } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const cardRef = useRef(null)

  // Server-side saved state — no localStorage!
  const [saved, setSaved] = useState(initialSaved)
  const [savingInProgress, setSavingInProgress] = useState(false)

  const skills = job.skills_required
    ? job.skills_required.split(',').map(s => s.trim()).filter(Boolean) : []
  const perks = []
  if (job.food_included)      perks.push(t('foodIncluded'))
  if (job.transport_included) perks.push(t('transportInc'))
  const payLabel = job.pay_type && job.pay_type !== 'negotiable' ? ` / ${job.pay_type}` : ''

  const mapsUrl = job.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location)}`
    : null

  const handleSave = async () => {
    if (!user) { toast.error('Login to save jobs'); navigate('/login'); return }
    if (savingInProgress) return
    setSavingInProgress(true)
    try {
      if (saved) {
        await api(`/api/jobs/${job.id}/save`, { method: 'DELETE' })
        setSaved(false)
        toast('Removed from saved jobs', { icon: '🗑️' })
      } else {
        await api(`/api/jobs/${job.id}/save`, { method: 'POST' })
        setSaved(true)
        toast.success(`${t('saved')} ♥`)
      }
    } catch (err) {
      toast.error(err.message || 'Could not save job')
    } finally {
      setSavingInProgress(false)
    }
  }

  const handleShare = async () => {
    const jobText = `We are hiring: *${job.title}*\n\n` +
      `🏢 Employer: ${job.employer_name || 'Employer'}\n` +
      (job.salary ? `💰 Pay: ${job.salary}${payLabel}\n` : '') +
      (job.location ? `📍 Location: ${job.location}\n` : '') +
      (job.duration ? `⏱️ Duration: ${job.duration}\n` : '') +
      (perks.length > 0 ? `✨ Perks: ${perks.join(', ')}\n` : '') +
      (skills.length > 0 ? `🛠️ Skills: ${skills.join(', ')}\n` : '') +
      `\n📝 Details:\n${job.description}\n\n` +
      `🔗 Apply safely on Workify: ${window.location.origin}/`;

    if (!cardRef.current) return
    const toastId = toast.loading('Preparing to share...')
    
    try {
      // Scale 4 for ultra-crisp clear photo
      const canvas = await html2canvas(cardRef.current, { 
        backgroundColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#13131A' : '#FAFAFA',
        scale: 4,
        useCORS: true,
        logging: false
      })
      
      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Blob generation failed')
        const file = new File([blob], `workify-job-${job.id}.png`, { type: 'image/png' })
        
        let shared = false
        // Try sharing photo + detailed text
        if (navigator.canShare && navigator.canShare({ files: [file], text: jobText })) {
          try {
            await navigator.share({
              title: job.title,
              text: jobText,
              files: [file]
            })
            shared = true
          } catch (err) { console.log('Share photo error:', err) }
        }

        // Fallback 1: Try sharing just detailed text
        if (!shared && navigator.share) {
          try {
            await navigator.share({
              title: job.title,
              text: jobText
            })
            shared = true
          } catch (err) { console.log('Share text error:', err) }
        }

        // Fallback 2: Copy to clipboard
        if (!shared) {
          try {
            await navigator.clipboard.writeText(jobText)
            toast.success('Job details copied to clipboard! 📋')
            shared = true // suppress second success toast below
          } catch (err) {
            toast.error('Sharing is not supported on this browser.')
          }
        }

        if (shared && navigator.share) {
          toast.success('Shared successfully! ✅')
        }
        toast.dismiss(toastId)
      }, 'image/png', 1.0)
    } catch (err) {
      toast.dismiss(toastId)
      toast.error('Failed to prepare share.')
    }
  }

  return (
    <div className="job-card" data-cat={job.category || 'General'} ref={cardRef}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <CatBadge cat={job.category} />
          <UrgencyBadge urgency={job.urgency} />
        </div>

        <div className="job-card-top">
          <h3>{job.title}</h3>
          {job.salary && <div className="job-salary">{job.salary}{payLabel}</div>}
        </div>

        <div className="job-employer">🏢 {job.employer_name || 'Employer'}</div>
        <div className="job-description">{job.description}</div>

        <div className="job-meta">
          {job.location && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className="job-tag location-tag" title="View on Google Maps">
              📍 {job.location} ↗
            </a>
          )}
          {job.duration  && <span className="job-tag">⏱️ {job.duration}</span>}
          {job.workers_needed > 1 && <span className="job-tag workers">👥 {t('workersNeeded')}: {job.workers_needed}</span>}
          {perks.map(p => <span key={p} className="job-tag perk">{p}</span>)}
        </div>

        {skills.length > 0 ? (
          <div className="job-skills">
            {skills.slice(0, 4).map(s => <span key={s} className="skill-chip">{s}</span>)}
            {skills.length > 4 && <span className="skill-chip">+{skills.length - 4}</span>}
          </div>
        ) : (
          <div className="mb-1">
            <span className="skill-chip no-exp">{t('noExpNeeded')}</span>
          </div>
        )}
      </div>

      <div className="job-card-footer">
        <span className="job-time">{timeAgo(job.created_at)}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Save (server-side) */}
          <button
            className={`icon-btn${saved ? ' saved' : ''}`}
            onClick={handleSave}
            title={saved ? t('saved') : t('saveJob')}
            disabled={savingInProgress}>
            {saved ? '♥' : '♡'}
          </button>
          {/* Share */}
          <button className="icon-btn" onClick={handleShare} title={t('shareJob')}>↗</button>

          {user?.role === 'seeker' && (
            applied
              ? <span className="badge badge-accepted">{t('applied')}</span>
              : <button className="btn btn-primary btn-sm" onClick={() => onApply?.(job.id)}>
                  {t('apply')}
                </button>
          )}
        </div>
      </div>
    </div>
  )
}
