import { useIdentity } from '@/state/identity/identityContext'

export default function NotificationsHeader({ unreadCount, onMarkAllSeen }) {
  const { identity } = useIdentity()
  const isVport = identity?.kind === 'vport'

  return (
    <div
      className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 backdrop-blur-sm"
      style={{
        background:
          'linear-gradient(180deg, rgba(4,6,14,0.6) 0%, rgba(4,6,14,0.22) 68%, rgba(4,6,14,0) 100%)',
      }}
    >
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-slate-100">
          {isVport ? 'Vport Notifications' : 'Notifications'}
          {unreadCount > 0 && ` (${unreadCount})`}
        </h1>

      </div>

      {unreadCount > 0 && (
        <button
          onClick={onMarkAllSeen}
          className="module-modern-btn module-modern-btn--ghost px-3 py-1.5 text-sm"
        >
          Mark all seen
        </button>
      )}
    </div>
  )
}
