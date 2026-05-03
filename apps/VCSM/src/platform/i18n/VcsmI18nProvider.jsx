import { useMemo, useEffect } from 'react'
import { I18nContext, createTranslator } from '@i18n'

export function VcsmI18nProvider({ locale, dictionary, children }) {
  const t = useMemo(() => {
    const translator = createTranslator(dictionary ?? {})
    if (!import.meta.env.DEV) return translator
    return function t(key, params) {
      const result = translator(key, params)
      if (result === key) console.warn('[i18n missing]', key)
      return result
    }
  }, [dictionary])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>
}
