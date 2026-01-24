// src/features/chat/inbox/screens/InboxChatSettingsScreen.jsx
// ============================================================
// InboxChatSettingsScreen (Full screen hub)
// ------------------------------------------------------------
// Sections:
// - Inbox (filters / folders / spam behavior)
// - Chat Settings (messaging behavior / safety)
// ============================================================

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

export default function InboxChatSettingsScreen() {
  const navigate = useNavigate()

  const rows = useMemo(
    () => [
      {
        section: 'Inbox',
        items: [
          {
            title: 'Inbox',
            subtitle: 'View all conversations',
            icon: '📥',
            onClick: () => navigate('/chat'),
          },
          {
            title: 'Spam',
            subtitle: 'View conversations marked as spam',
            icon: '🚫',
            onClick: () => navigate('/chat/spam'),
          },
          {
            title: 'Requests',
            subtitle: 'People who messaged you first',
            icon: '🧾',
            onClick: () => navigate('/chat/requests'),
          },
          {
            title: 'Archived',
            subtitle: 'Hidden from main inbox',
            icon: '🗃️',
            onClick: () => navigate('/chat/archived'),
          },
        ],
      },
      {
        section: 'Chat settings',
        items: [
          {
            title: 'Blocked users',
            subtitle: 'Manage who cannot message you',
            icon: '⛔',
            onClick: () => navigate('/chat/settings/blocked'),
          },
          {
            title: 'Message privacy',
            subtitle: 'Who can message you',
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
      {/* HEADER */}
      <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg px-3 py-1 text-sm text-neutral-200 hover:bg-white/10"
        >
          Back
        </button>

        <h1 className="text-lg font-semibold text-white">Inbox & Chat</h1>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {rows.map((group) => (
          <div key={group.section} className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-neutral-400">
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
