import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import '@/shared/styles/settings-modern.css'
import { useTranslation } from '@i18n'

const PrivacyView = lazy(() => import('../privacy/ui/PrivacyTab.view'))
const ProfileView = lazy(() => import('../profile/adapter/ProfileTab'))
const AccountView = lazy(() => import('../account/ui/AccountTab.view'))
const VportsView = lazy(() => import('../vports/ui/VportsTab.view'))

const TAB_DEFS = [
  { key: 'privacy', View: PrivacyView },
  { key: 'profile', View: ProfileView },
  { key: 'account', View: AccountView },
  { key: 'vports', View: VportsView },
]

export default function SettingsScreen() {
  const navigate = useNavigate()
  const [search, setSearch] = useSearchParams()
  const { t } = useTranslation()

  const TABS = TAB_DEFS.map(({ key, View }) => ({ key, label: t(`settings.tabs.${key}`), View }))

  const initialTab = useMemo(() => {
    const q = (search.get('tab') || '').toLowerCase()
    return TAB_DEFS.some((def) => def.key === q) ? q : 'privacy'
  }, [search])

  const [tab, setTab] = useState(initialTab)

  useEffect(() => {
    const curr = (search.get('tab') || '').toLowerCase()
    if (curr !== tab) {
      const next = new URLSearchParams(search)
      next.set('tab', tab)
      setSearch(next, { replace: true })
    }
  }, [tab, search, setSearch])

  const activeIndex = useMemo(() => TAB_DEFS.findIndex((def) => def.key === tab), [tab])
  const tabRefs = useRef([])

  const focusIdx = (idx) => {
    const el = tabRefs.current[idx]
    if (el) el.focus()
  }

  const onKeyTabs = useCallback(
    (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
      e.preventDefault()

      if (e.key === 'Home') {
        setTab(TABS[0].key)
        focusIdx(0)
        return
      }

      if (e.key === 'End') {
        const last = TABS.length - 1
        setTab(TABS[last].key)
        focusIdx(last)
        return
      }

      const dir = e.key === 'ArrowRight' ? 1 : -1
      const next = (activeIndex + dir + TABS.length) % TABS.length
      setTab(TABS[next].key)
      focusIdx(next)
    },
    [activeIndex]
  )

  return (
    <div className="settings-modern-page relative h-full w-full overflow-y-auto touch-pan-y text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_220px_at_50%_-80px,rgba(99,102,241,0.22),transparent)]"
      />

      <header className="sticky top-0 z-20 border-b border-white/8 bg-[#060914]/74 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-3xl px-4">
          <div className="flex items-center justify-between py-3">
            <h1 className="text-lg font-bold tracking-wide text-white">{t('settings.title')}</h1>
            <button
              onClick={() => navigate(-1)}
              className="settings-btn settings-btn--ghost px-3 py-1.5 text-sm"
            >
              {t('actions.close')}
            </button>
          </div>

          <div
            role="tablist"
            aria-label={t('settings.settingsSections')}
            onKeyDown={onKeyTabs}
            className="settings-tablist mb-3 grid gap-1 rounded-2xl p-1"
            style={{ gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))` }}
          >
            {TABS.map((t, i) => {
              const active = tab === t.key
              return (
                <button
                  key={t.key}
                  ref={(el) => (tabRefs.current[i] = el)}
                  onClick={() => setTab(t.key)}
                  className={[
                    'settings-tab h-9 rounded-xl text-xs font-semibold transition',
                    active ? 'settings-tab--active' : '',
                  ].join(' ')}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-3xl px-4 pb-24 pt-4">
        {TABS.map((item) => {
          const ActiveView = item.View
          return (
            <section key={item.key} hidden={tab !== item.key}>
              {tab === item.key && (
                <Suspense fallback={<div className="py-10 text-center text-white/50">{t('settings.loading')}</div>}>
                  <ActiveView />
                </Suspense>
              )}
            </section>
          )
        })}
      </main>
    </div>
  )
}
