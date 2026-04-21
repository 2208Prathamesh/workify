import { useLang } from '../context/LangContext'

export default function MapCard({ location, compact = false }) {
  const { t } = useLang()
  if (!location) return null

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`

  if (compact) {
    return (
      <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
        className="map-chip" title={`View ${location} on Google Maps`}>
        📍 {location}
      </a>
    )
  }

  return (
    <div className="map-card" style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
      <div className="map-addr" style={{ flex: 1 }}>
        <span className="map-pin" style={{ marginRight: '8px' }}>📍</span>
        <span style={{ fontWeight: 500 }}>{location}</span>
      </div>
      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
        {t('viewOnMap')} ↗
      </a>
    </div>
  )
}
