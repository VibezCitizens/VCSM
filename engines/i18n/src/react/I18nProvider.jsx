import React, { createContext, useMemo } from 'react'
import { createTranslator } from '../createTranslator.js'

export const I18nContext = createContext(null)

export function I18nProvider({ dictionary, children }) {
  const t = useMemo(() => createTranslator(dictionary ?? {}), [dictionary])
  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>
}

export default I18nProvider
