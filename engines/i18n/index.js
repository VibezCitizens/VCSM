// engines/i18n/index.js
// ============================================================
// i18n Engine — Entry Point
// ============================================================
// Apps import engine code (createTranslator, hooks, context)
// from this file via the @i18n alias.
//
// Platform translation data (en/, es/ JSON files) is accessed
// via the @i18n/* wildcard alias:
//   import commonEn from '@i18n/en/common.json'
// ============================================================

export { createTranslator } from './src/createTranslator.js'
export { interpolate } from './src/interpolate.js'
export { I18nContext, I18nProvider } from './src/react/I18nProvider.jsx'
export { useTranslation } from './src/react/useTranslation.js'
