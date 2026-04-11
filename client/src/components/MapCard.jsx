import { useLang } from '../context/LangContext'

export default function MapCard({ location, compact = false }) {
  const { t } = useLang()
  if (!location) return null

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(location)}&output=embed&z=14`

  if (compact) {
    return (
      <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
        className="map-chip" title={`View ${location} on Google Maps`}>
        📍 {location}
      </a>
    )
  }

  return (
    <div className="map-card" style={{ padding: '16px', background: 'var(--surface-solid)', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <div className="map-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="map-addr" style={{ fontWeight: 500 }}>
          <span className="map-pin">📍</span>
          <span>{location}</span>
        </div>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          className="btn btn-sm btn-primary">
          {t('viewOnMap')} →
        </a>
      </div>
    </div>
  )
}
