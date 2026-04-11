export const JOB_CATEGORIES = [
  { id: 'All',          icon: '🌐', label: 'All Jobs'     },
  { id: 'Construction', icon: '🏗️', label: 'Construction' },
  { id: 'Domestic',     icon: '🏠', label: 'Domestic'     },
  { id: 'Delivery',     icon: '🚚', label: 'Delivery'     },
  { id: 'Agriculture',  icon: '🌾', label: 'Agriculture'  },
  { id: 'Kitchen',      icon: '🍳', label: 'Kitchen'      },
  { id: 'Cleaning',     icon: '🧹', label: 'Cleaning'     },
  { id: 'Warehouse',    icon: '📦', label: 'Warehouse'    },
  { id: 'Repair',       icon: '🔧', label: 'Repair'       },
  { id: 'General',      icon: '💼', label: 'General'      },
]

export const PAY_TYPES = [
  { id: 'daily',      label: '📅 Daily'      },
  { id: 'hourly',     label: '⏱️ Hourly'     },
  { id: 'contract',   label: '📋 Contract'   },
  { id: 'negotiable', label: '💬 Negotiable' },
]

export const CAT_STYLES = {
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

export function getCatStyle(cat) {
  return CAT_STYLES[cat] || CAT_STYLES.General
}

export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'Z')
  const diff = Math.floor((Date.now() - d) / 1000)
  if (diff < 60)     return 'Just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString()
}

export function getCatEmoji(cat) {
  return CAT_STYLES[cat]?.icon || '💼'
}
