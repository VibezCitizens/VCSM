import { useIdentity } from '@/state/identity/identityContext'

export default function NotificationsHeader({ unreadCount, onMarkAllSeen }) {
  const { identity } = useIdentity()
  const isVport = identity?.kind === 'vport'
  const title = isVport ? 'Vport Notifications' : 'Notifications'

  return (
    <div className="notifications-header-shell sticky top-0 z-10 mb-3 flex items-center justify-between px-4 py-3.5">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--vc-text)' }}>
          {title}
        </h1>
        {unreadCount > 0 && (
          <span className="text-xs" style={{ color: 'var(--vc-text-muted)' }}>
            {unreadCount} unread
          </span>
        )}
      </div>

      {unreadCount > 0 && (
        <button
          onClick={onMarkAllSeen}
          className="notifications-action-btn notifications-action-btn--ghost px-3 py-1.5 text-sm"
        >
          Mark all read
        </button>
      )}
    </div>
  )
}
