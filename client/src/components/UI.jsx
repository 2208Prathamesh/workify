export function Spinner() {
  return (
    <div className="loading-spinner">
      <div className="spinner" />
    </div>
  )
}

export function EmptyState({ title, desc, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">📭</div>
      <h3>{title}</h3>
      <p>{desc}</p>
      {action}
    </div>
  )
}

export function StatCard({ icon, number, label, color = 'orange' }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className={`stat-number ${color}`}>{number}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export function CatBadgeSm({ cat }) {
  const map = {
    Construction: { cls: 'cat-construction', icon: '🏗️' },
    Domestic:     { cls: 'cat-domestic',     icon: '🏠' },
    Delivery:     { cls: 'cat-delivery',     icon: '🚚' },
    Agriculture:  { cls: 'cat-agriculture',  icon: '🌾' },
    Kitchen:      { cls: 'cat-kitchen',      icon: '🍳' },
    Cleaning:     { cls: 'cat-cleaning',     icon: '🧹' },
    Warehouse:    { cls: 'cat-warehouse',    icon: '📦' },
    Repair:       { cls: 'cat-repair',       icon: '🔧' },
    General:      { cls: 'cat-general',      icon: '💼' },
  }
  const s = map[cat] || map.General
  return <span className={`job-cat-badge ${s.cls}`}>{s.icon} {cat || 'General'}</span>
}

export function UrgencyLabel({ urgency }) {
  if (urgency === 'today')
    return <span className="urgency-badge urgency-today"><span className="pulse-dot" /> Today</span>
  if (urgency === 'week')
    return <span className="urgency-badge urgency-week">🟡 This Week</span>
  return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Normal</span>
}

export function Badge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>
}
