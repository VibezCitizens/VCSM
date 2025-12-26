// src/features/settings/screen/SettingsScreen.jsx
// ============================================================
// SETTINGS — SCREEN
// - Owns tab state + navigation
// - Renders domain views directly
// - URL-synced (?tab=privacy)
// - Keyboard accessible
// ============================================================

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

/* ============================================================
   LAZY DOMAIN VIEWS
   ============================================================ */

const PrivacyView = lazy(() => import('../privacy/ui/PrivacyTab.view'))
const ProfileView = lazy(() => import('../profile/adapter/ProfileTab'))
const AccountView = lazy(() => import('../account/ui/AccountTab.view'))
const VportsView  = lazy(() => import('../vports/ui/VportsTab.view'))
// const SponsoredView = lazy(() => import('../sponsored/ui/Omd.view'))

/* ============================================================
   TAB REGISTRY (SSOT)
   ============================================================ */

const TABS = [
  { key: 'privacy', label: 'Privacy', View: PrivacyView },
  { key: 'profile', label: 'Profile', View: ProfileView },
  { key: 'account', label: 'Account', View: AccountView },
  { key: 'vports',  label: 'VPORTs',  View: VportsView },
  // { key: 'sponsored', label: 'Sponsored', View: SponsoredView },
]

/* ============================================================
   SCREEN
   ============================================================ */

export default function SettingsScreen() {
  const navigate = useNavigate()
  const [search, setSearch] = useSearchParams()

  /* ------------------------------------------------------------
     INITIAL TAB (FROM URL)
  ------------------------------------------------------------ */
  const initialTab = useMemo(() => {
    const q = (search.get('tab') || '').toLowerCase()
    return TABS.some(t => t.key === q) ? q : 'privacy'
  }, [search])

  const [tab, setTab] = useState(initialTab)

  /* ------------------------------------------------------------
     URL SYNC (?tab=…)
  ------------------------------------------------------------ */
  useEffect(() => {
    const curr = (search.get('tab') || '').toLowerCase()
    if (curr !== tab) {
      const next = new URLSearchParams(search)
      next.set('tab', tab)
      setSearch(next, { replace: true })
    }
  }, [tab, search, setSearch])

  /* ------------------------------------------------------------
     KEYBOARD NAVIGATION
  ------------------------------------------------------------ */
  const activeIndex = useMemo(
    () => TABS.findIndex(t => t.key === tab),
    [tab]
  )

  const tabRefs = useRef([])

  const setTabRef = (el, idx) => {
    tabRefs.current[idx] = el
  }

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

  /* ------------------------------------------------------------
     RENDER
  ------------------------------------------------------------ */
  return (
    <div className="min-h-[100dvh] bg-black text-white">
      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0
          bg-[radial-gradient(600px_200px_at_50%_-80px,rgba(168,85,247,0.15),transparent)]"
      />

      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4">
          <div className="flex items-center justify-between py-3">
            <h1 className="text-lg font-bold tracking-wide">Settings</h1>
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-300
                         hover:text-white hover:bg-white/5"
              aria-label="Close settings"
            >
              Close
            </button>
          </div>

          {/* TAB BAR */}
          <div
            role="tablist"
            aria-label="Settings sections"
            onKeyDown={onKeyTabs}
            className={[
              'mb-3 grid gap-1 rounded-2xl',
              'bg-zinc-900/80 p-1 ring-1 ring-white/5',
            ].join(' ')}
            style={{ gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))` }}
          >
            {TABS.map((t, i) => {
              const active = tab === t.key
              return (
                <button
                  key={t.key}
                  id={`tab-${t.key}`}
                  role="tab"
                  aria-selected={active}
                  aria-controls={`panel-${t.key}`}
                  tabIndex={active ? 0 : -1}
                  ref={(el) => setTabRef(el, i)}
                  onClick={() => setTab(t.key)}
                  className={[
                    'h-9 rounded-xl text-xs font-semibold transition',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
                    active
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-300 hover:text-white hover:bg-white/5',
                  ].join(' ')}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-4">
        {TABS.map(({ key, View }) => (
          <section
            key={key}
            id={`panel-${key}`}
            role="tabpanel"
            aria-labelledby={`tab-${key}`}
            hidden={tab !== key}
            className="rounded-2xl"
          >
            {tab === key && (
              <Suspense
                fallback={
                  <div className="py-10 text-center text-zinc-400">
                    Loading…
                  </div>
                }
              >
                <View />
              </Suspense>
            )}
          </section>
        ))}
      </main>
    </div>
  )
}
