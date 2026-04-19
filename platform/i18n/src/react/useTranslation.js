import { useContext } from 'react'
import { I18nContext } from './I18nProvider.jsx'
import { createTranslator } from '../createTranslator.js'

const fallbackT = createTranslator({})

export function useTranslation() {
  const t = useContext(I18nContext) ?? fallbackT
  return { t }
}
