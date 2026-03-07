import { useIdentity } from '@/state/identity/identityContext'

export default function NotificationsHeader({ unreadCount, onMarkAllSeen }) {
  const { identity } = useIdentity()
  const isVport = identity?.kind === 'vport'

  return (
    <div
      className="notifications-header-shell sticky top-0 z-10 mb-2 flex items-center justify-between px-4 py-3"
    >
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-slate-50">
          {isVport ? 'Vport Notifications' : 'Notifications'}
          {unreadCount > 0 && ` (${unreadCount})`}
        </h1>

      </div>

      {unreadCount > 0 && (
        <button
          onClick={onMarkAllSeen}
          className="notifications-action-btn notifications-action-btn--ghost px-3 py-1.5 text-sm"
        >
          Mark all seen
        </button>
      )}
    </div>
  )
}
