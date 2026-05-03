import { createContext, useContext, useState } from 'react'

const STORAGE_KEY = 'vcsm.locale'
const SUPPORTED = ['en', 'es']

const LocaleContext = createContext(null)

function detectDefault() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && SUPPORTED.includes(stored)) return stored
  } catch {
    // localStorage unavailable (SSR / private mode edge case)
  }
  const browser = (typeof navigator !== 'undefined' ? navigator.language : '') || ''
  return browser.toLowerCase().startsWith('es') ? 'es' : 'en'
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(detectDefault)

  function setLocale(next) {
    if (!SUPPORTED.includes(next)) return
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage unavailable
    }
    setLocaleState(next)
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
