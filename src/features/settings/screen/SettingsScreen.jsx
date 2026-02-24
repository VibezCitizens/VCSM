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
import '@/features/settings/styles/settings-modern.css'

const PrivacyView = lazy(() => import('../privacy/ui/PrivacyTab.view'))
const ProfileView = lazy(() => import('../profile/adapter/ProfileTab'))
const AccountView = lazy(() => import('../account/ui/AccountTab.view'))
const VportsView = lazy(() => import('../vports/ui/VportsTab.view'))

const TABS = [
  { key: 'privacy', label: 'Privacy', View: PrivacyView },
  { key: 'profile', label: 'Profile', View: ProfileView },
  { key: 'account', label: 'Account', View: AccountView },
  { key: 'vports', label: 'VPORTs', View: VportsView },
]

export default function SettingsScreen() {
  const navigate = useNavigate()
  const [search, setSearch] = useSearchParams()

  const initialTab = useMemo(() => {
    const q = (search.get('tab') || '').toLowerCase()
    return TABS.some((t) => t.key === q) ? q : 'privacy'
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

  const activeIndex = useMemo(() => TABS.findIndex((t) => t.key === tab), [tab])
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
    <div className="settings-modern-page relative h-full w-full overflow-y-auto touch-pan-y text-slate-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_220px_at_50%_-80px,rgba(99,102,241,0.22),transparent)]"
      />

      <header className="sticky top-0 z-20 border-b border-slate-300/10 bg-[#060914]/72 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4">
          <div className="flex items-center justify-between py-3">
            <h1 className="text-lg font-bold tracking-wide text-slate-100">Settings</h1>
            <button
              onClick={() => navigate(-1)}
              className="settings-btn settings-btn--ghost px-3 py-1.5 text-sm"
            >
              Close
            </button>
          </div>

          <div
            role="tablist"
            aria-label="Settings sections"
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
                <Suspense fallback={<div className="py-10 text-center text-slate-400">Loading...</div>}>
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
