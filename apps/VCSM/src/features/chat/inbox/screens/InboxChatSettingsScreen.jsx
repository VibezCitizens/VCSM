import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import '@/features/ui/modern/module-modern.css'
import '@/features/chat/styles/chat-modern.css'

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
            icon: 'VOX',
            onClick: () => navigate('/chat/settings/inbox'),
          },
          {
            title: 'Spam',
            subtitle: 'Vox you marked as spam',
            icon: 'SPM',
            onClick: () => navigate('/chat/spam'),
          },
          {
            title: 'Requests',
            subtitle: 'Citizens who reached out first',
            icon: 'REQ',
            onClick: () => navigate('/chat/requests'),
          },
          {
            title: 'Archived',
            subtitle: 'Hidden from main Vox',
            icon: 'ARC',
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
            icon: 'BLK',
            onClick: () => navigate('/chat/settings/blocked'),
          },
          {
            title: 'Vox privacy',
            subtitle: 'Who can Vox you',
            icon: 'PRV',
            onClick: () => navigate('/chat/settings/privacy'),
          },
          {
            title: 'Safety',
            subtitle: 'Spam and reporting preferences',
            icon: 'SFT',
            onClick: () => navigate('/chat/settings/safety'),
          },
        ],
      },
    ],
    [navigate]
  )

  return (
    <div className="module-modern-page chat-modern-page flex h-full flex-col">
      <div className="module-modern-shell chat-modern-shell mx-auto flex h-full w-full max-w-2xl flex-col rounded-2xl">
        <header
          className="chat-modern-sticky-header sticky top-0 z-20 border-b border-white/8 bg-[#070b16]/75 backdrop-blur"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="relative flex h-14 items-center px-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="-ml-1 p-2 text-purple-300 transition hover:text-purple-300"
              aria-label="Back"
            >
              <ChevronLeft size={22} />
            </button>
            <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white">
              Vox and Chat
            </h1>
            <div className="ml-auto w-10" />
          </div>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
          {rows.map((group) => (
            <section key={group.section} className="space-y-2">
              <div className="px-1 text-xs uppercase tracking-wider text-white/50">{group.section}</div>
              <div className="module-modern-card overflow-hidden rounded-2xl">
                {group.items.map((item, idx) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={item.onClick}
                    className={[
                      'chat-modern-settings-row flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5',
                      idx !== group.items.length - 1 ? 'border-b border-white/8' : '',
                    ].join(' ')}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/4 text-[11px] font-semibold tracking-wide text-white">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-white">{item.title}</div>
                      {item.subtitle ? <div className="truncate text-xs text-white/50">{item.subtitle}</div> : null}
                    </div>
                    <div className="ml-auto text-white/40">{'>'}</div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
