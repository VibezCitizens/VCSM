// src/features/profiles/screens/views/ActorProfileTabs.jsx
import { useMemo } from 'react'

const BASE_TABS = [
  { key: 'photos', label: 'Photos' },
  { key: 'videos', label: 'Videos' },
  { key: 'posts', label: 'Vibes' },
  { key: 'friends', label: 'Friends' },
]

export default function ActorProfileTabs({
  tab,
  setTab,
  includeTags = false,
}) {
  const tabs = useMemo(
    () =>
      includeTags
        ? [
            ...BASE_TABS.slice(0, 3),
            { key: 'tags', label: 'Tags' },
            BASE_TABS[3],
          ]
        : BASE_TABS,
    [includeTags]
  )

  return (
    <div className="mt-4 px-4 relative z-30">
      <div className="profiles-shell w-full">
        <div className="profiles-tabbar relative flex justify-center gap-7 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => {
            const active = tab === t.key

            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`
                  profiles-tab-btn
                  relative py-3
                  text-[17px] tracking-wide whitespace-nowrap transition-all duration-300
                  ${active ? 'is-active' : ''}
                `}
                aria-current={active ? 'page' : undefined}
                data-active={active ? 'true' : 'false'}
              >
                {t.label}

                {active && (
                  <span className="profiles-tab-indicator pointer-events-none absolute left-0 right-0 -bottom-[1px] h-[3px] rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
