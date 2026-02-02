// src/features/chat/inbox/screens/InboxChatSettingsScreen.jsx
// ============================================================
// InboxChatSettingsScreen (Full screen hub)
// ------------------------------------------------------------
// Sections:
// - Vox (filters / folders / spam behavior)
// - Chat Settings (messaging behavior / safety)
// ============================================================

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function InboxChatSettingsScreen() {
  const navigate = useNavigate()

  const rows = useMemo(
    () => [
      {
        section: 'Vox',
        items: [
          {
            title: 'Vox',
            subtitle: 'Vox preferences',
            icon: '⚡',
            onClick: () => navigate('/chat/settings/inbox'),
          },
          {
            title: 'Spam',
            subtitle: 'Vox you marked as spam',
            icon: '🚫',
            onClick: () => navigate('/chat/spam'),
          },
          {
            title: 'Requests',
            subtitle: 'Citizens who reached out first',
            icon: '🧾',
            onClick: () => navigate('/chat/requests'),
          },
          {
            title: 'Archived',
            subtitle: 'Hidden from main Vox',
            icon: '🗃️',
            onClick: () => navigate('/chat/archived'),
          },
        ],
      },
      {
        section: 'Chat Settings',
        items: [
          {
            title: 'Blocked Citizens',
            subtitle: 'Manage who cannot Vox you',
            icon: '⛔',
            onClick: () => navigate('/chat/settings/blocked'),
          },
          {
            title: 'Vox privacy',
            subtitle: 'Who can Vox you',
            icon: '🔒',
            onClick: () => navigate('/chat/settings/privacy'),
          },
          {
            title: 'Safety',
            subtitle: 'Spam & reporting preferences',
            icon: '🛡️',
            onClick: () => navigate('/chat/settings/safety'),
          },
        ],
      },
    ],
    [navigate]
  )

  return (
    <div className="flex flex-col h-full">
      {/* HEADER (ChatHeader-style, centered title) */}
      <header
        className="
          sticky top-0 z-20
          bg-black/90 backdrop-blur
          border-b border-white/10
        "
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="relative h-14 px-3 flex items-center">
          {/* LEFT: Back */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              p-2 -ml-1 rounded-xl
              text-violet-400
              hover:bg-violet-500/15
              active:bg-violet-500/25
              transition
            "
            aria-label="Back"
          >
            <ChevronLeft size={22} />
          </button>

          {/* CENTER: Title */}
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white">
            Vox & Chat
          </h1>

          {/* RIGHT: spacer */}
          <div className="ml-auto w-10" />
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {rows.map((group) => (
          <div key={group.section} className="space-y-2">
            {/* ✅ align section label left with the card content */}
            <div className="px-4 text-xs uppercase tracking-wider text-neutral-400">
              {group.section}
            </div>

            <div className="rounded-2xl border border-white/10 overflow-hidden bg-neutral-900/40">
              {group.items.map((item, idx) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={item.onClick}
                  className={[
                    'w-full flex items-center gap-3 px-4 py-3 text-left',
                    'hover:bg-white/5',
                    idx !== group.items.length - 1 ? 'border-b border-white/10' : '',
                  ].join(' ')}
                >
                  <div className="w-9 h-9 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center">
                    <span className="text-lg">{item.icon}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="text-white font-medium">{item.title}</div>
                    {item.subtitle && (
                      <div className="text-xs text-neutral-400 truncate">
                        {item.subtitle}
                      </div>
                    )}
                  </div>

                  <div className="ml-auto text-neutral-500">›</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
