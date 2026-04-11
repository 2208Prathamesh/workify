import { useState } from 'react'

const STAR_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' }

/* ─── Display-only star row ────────────────────────────────── */
export function StarDisplay({ rating, size = 'md', showCount, count }) {
  const r = parseFloat(rating) || 0
  const full  = Math.floor(r)
  const half  = r - full >= 0.25 && r - full < 0.75
  const empty = 5 - full - (half ? 1 : 0)
  const sz = size === 'sm' ? '0.85rem' : size === 'lg' ? '1.5rem' : '1.1rem'

  return (
    <span className="star-display" style={{ fontSize: sz }}>
      {'★'.repeat(full)}
      {half ? '⯨' : ''}
      {'☆'.repeat(empty)}
      {rating != null && (
        <span className="star-value">{Number(rating).toFixed(1)}</span>
      )}
      {showCount && count != null && (
        <span className="star-count">({count})</span>
      )}
    </span>
  )
}

/* ─── Interactive picker ────────────────────────────────────── */
export function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  const active = hover || value

  return (
    <div className="star-picker">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`star-btn${n <= active ? ' on' : ''}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          title={STAR_LABELS[n]}
        >
          ★
        </button>
      ))}
      {active > 0 && <span className="star-label">{STAR_LABELS[active]}</span>}
    </div>
  )
}

/* ─── Review Card ──────────────────────────────────────────── */
export function ReviewCard({ rating }) {
  return (
    <div className="review-card">
      <div className="review-header">
        <div className="review-avatar">{(rating.reviewer_name || 'E')[0]}</div>
        <div>
          <div className="review-name">{rating.reviewer_name}</div>
          {rating.job_title && <div className="review-job">for "{rating.job_title}"</div>}
        </div>
        <div className="review-stars">
          <StarDisplay rating={rating.stars} size="sm" />
        </div>
      </div>
      {rating.review && <p className="review-text">"{rating.review}"</p>}
      <div className="review-date">{new Date(rating.created_at + 'Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
    </div>
  )
}
