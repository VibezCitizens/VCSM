// src/features/profiles/screens/views/ActorProfileTabs.jsx

const DEFAULT_TABS = [
  { key: 'photos', label: 'Photos' },
  { key: 'videos', label: 'Videos' },
  { key: 'posts', label: 'Vibes' },   // ✅ UI label updated
  { key: 'friends', label: 'Friends' },
]

export default function ActorProfileTabs({
  tab,
  setTab,
}) {
  return (
    <div className="mt-4 px-4 relative z-30">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex justify-center gap-10 border-b border-white/15">
          {DEFAULT_TABS.map((t) => {
            const active = tab === t.key

            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`
                  relative py-3
                  text-[18px] tracking-wide transition-colors
                  ${
                    active
                      ? 'text-white font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }
                `}
                aria-current={active ? 'page' : undefined}
              >
                {t.label}

                {active && (
                  <span
                    className="
                      absolute left-0 right-0 -bottom-[1px]
                      h-[2px] bg-white/90 rounded-full
                    "
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
