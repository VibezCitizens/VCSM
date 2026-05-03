import { useLocale } from './useLocale.jsx'

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <div className="locale-switcher" role="group" aria-label="Language">
      <button
        type="button"
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
        disabled={locale === 'en'}
      >
        EN
      </button>
      <span aria-hidden="true">|</span>
      <button
        type="button"
        onClick={() => setLocale('es')}
        aria-pressed={locale === 'es'}
        disabled={locale === 'es'}
      >
        ES
      </button>
    </div>
  )
}
