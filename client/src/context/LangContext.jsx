import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import T from '../lib/translations'

const LangContext = createContext(null)

// Auto-detect from browser — no localStorage!
function detectLang() {
  const lang = (navigator.language || navigator.userLanguage || 'en').toLowerCase()
  if (lang.startsWith('hi')) return 'hi'
  if (lang.startsWith('mr')) return 'mr'
  return 'en'
}

export function LangProvider({ children }) {
  // Use sessionStorage as fallback for guests (clears when tab closes — NOT persistent localStorage)
  const [lang, setLangState] = useState(() => {
    try { return sessionStorage.getItem('w-lang') || detectLang() } catch { return detectLang() }
  })

  // Apply font + lang attribute whenever lang changes
  useEffect(() => {
    document.documentElement.setAttribute('lang', lang)
    if (lang !== 'en') {
      document.body.classList.add('devanagari')
    } else {
      document.body.classList.remove('devanagari')
    }
  }, [lang])

  // setLang — persists to DB if logged in, else sessionStorage
  const setLang = useCallback(async (newLang, isLoggedIn = false) => {
    setLangState(newLang)
    try { sessionStorage.setItem('w-lang', newLang) } catch {}
    if (isLoggedIn) {
      // Persist to DB (no localStorage needed)
      try {
        await fetch('/api/auth/lang', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lang: newLang })
        })
      } catch {} // silent — not critical
    }
  }, [])

  // Called after login — sync lang from user.lang_pref (from DB)
  const syncLangFromUser = useCallback((user) => {
    if (user?.lang_pref && user.lang_pref !== 'auto' && ['en','hi','mr'].includes(user.lang_pref)) {
      setLangState(user.lang_pref)
      try { sessionStorage.setItem('w-lang', user.lang_pref) } catch {}
    }
  }, [])

  const t = (key) => {
    if (!T[key]) return key
    return T[key][lang] || T[key]['en'] || key
  }

  const tCat = (catId) => {
    const map = {
      'All': t('catAll'), 'Construction': t('catConstruction'),
      'Domestic': t('catDomestic'), 'Delivery': t('catDelivery'),
      'Agriculture': t('catAgriculture'), 'Kitchen': t('catKitchen'),
      'Cleaning': t('catCleaning'), 'Warehouse': t('catWarehouse'),
      'Repair': t('catRepair'), 'General': t('catGeneral'),
    }
    return map[catId] || catId
  }

  return (
    <LangContext.Provider value={{ lang, setLang, syncLangFromUser, t, tCat }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be inside LangProvider')
  return ctx
}
