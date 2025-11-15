// src/features/settings/screens/SettingsScreen.jsx
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Lazy-load the tabs (optional but nice for perf)
const PrivacyTab = lazy(() => import('./tabs/PrivacyTab'));
const ProfileTab = lazy(() => import('./tabs/ProfileTab.jsx'));
const AccountTab = lazy(() => import('./tabs/AccountTab'));
const VportsTab  = lazy(() => import('./tabs/VportsTab'));

const TABS = [
  { key: 'privacy', label: 'Privacy' },
  { key: 'profile', label: 'Profile' },
  { key: 'account', label: 'Account' },
  { key: 'vports',  label: 'VPORTs' },
];

export default function SettingsScreen() {
  const nav = useNavigate();
  const [search, setSearch] = useSearchParams();

  // Restore from ?tab=… (fallback to 'privacy' if unknown)
  const initial = useMemo(() => {
    const q = (search.get('tab') || '').toLowerCase();
    return TABS.some(t => t.key === q) ? q : 'privacy';
  }, [search]);

  const [tab, setTab] = useState(initial);

  // Keep URL in sync when tab changes (replace, not push)
  useEffect(() => {
    const curr = (search.get('tab') || '').toLowerCase();
    if (curr !== tab) {
      const next = new URLSearchParams(search);
      next.set('tab', tab);
      setSearch(next, { replace: true });
    }
  }, [tab, search, setSearch]);

  // Compute active index
  const activeIndex = useMemo(() => TABS.findIndex(t => t.key === tab), [tab]);

  // Keep refs for roving focus when using arrows
  const tabRefs = useRef([]);
  tabRefs.current = [];

  const setTabRef = (el) => {
    if (el && !tabRefs.current.includes(el)) {
      tabRefs.current.push(el);
    }
  };

  const focusIdx = (idx) => {
    const el = tabRefs.current[idx];
    if (el) el.focus();
  };

  const onKeyTabs = useCallback((e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'Home') {
      setTab(TABS[0].key);
      focusIdx(0);
      return;
    }
    if (e.key === 'End') {
      setTab(TABS[TABS.length - 1].key);
      focusIdx(TABS.length - 1);
      return;
    }
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const next = (activeIndex + dir + TABS.length) % TABS.length;
    setTab(TABS[next].key);
    focusIdx(next);
  }, [activeIndex]);

  return (
    <div className="min-h-[100dvh] bg-black text-white">
      {/* Soft background accents for a premium feel */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(600px_200px_at_50%_-80px,rgba(168,85,247,0.15),transparent)]"
      />

      {/* Sticky header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4">
          <div className="flex items-center justify-between py-3">
            <h1 className="text-lg font-bold tracking-wide">Settings</h1>
            <button
              onClick={() => nav(-1)}
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5"
              title="Back"
              aria-label="Close settings"
            >
              Close
            </button>
          </div>

          {/* Segmented tabs */}
          <div
            role="tablist"
            aria-label="Settings tabs"
            onKeyDown={onKeyTabs}
            className="mb-3 rounded-2xl bg-zinc-900/80 p-1 grid grid-cols-4 gap-1 ring-1 ring-white/5"
          >
            {TABS.map((t, i) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  id={`tab-${t.key}`}                          // <-- add id to satisfy aria-labelledby
                  role="tab"
                  aria-selected={active}
                  aria-controls={`panel-${t.key}`}
                  tabIndex={active ? 0 : -1}
                  ref={setTabRef}
                  onClick={() => setTab(t.key)}
                  className={[
                    "h-9 rounded-xl text-xs font-semibold transition",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                    active
                      ? "bg-white text-black shadow-sm"
                      : "text-zinc-300 hover:text-white hover:bg-white/5"
                  ].join(" ")}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Tab content area */}
      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-4">
        {TABS.map((t) => (
          <section
            key={t.key}
            id={`panel-${t.key}`}
            role="tabpanel"
            aria-labelledby={`tab-${t.key}`}
            hidden={tab !== t.key}
            className="rounded-2xl"
          >
            {tab === t.key && (
              <Suspense fallback={<div className="py-10 text-center text-zinc-400">Loading…</div>}>
                {t.key === 'privacy' && <PrivacyTab />}
                {t.key === 'profile' && <ProfileTab />}
                {t.key === 'account' && <AccountTab />}
                {t.key === 'vports'  && <VportsTab  />}
              </Suspense>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
