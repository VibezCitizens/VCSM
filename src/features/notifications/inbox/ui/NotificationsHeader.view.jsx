import { useIdentity } from '@/state/identity/identityContext'

export default function NotificationsHeader({
  unreadCount,
  onMarkAllSeen,
}) {
  const { identity } = useIdentity()

  const isVport = identity?.kind === 'vport'

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold">
          {isVport ? 'Vport Notifications' : 'Notifications'}
          {unreadCount > 0 && ` (${unreadCount})`}
        </h1>

        {isVport && (
          <span className="text-xs text-neutral-400">
            Acting as {identity.displayName}
          </span>
        )}
      </div>

      {unreadCount > 0 && (
        <button
          onClick={onMarkAllSeen}
          className="text-sm text-neutral-400 hover:text-white"
        >
          Mark all seen
        </button>
      )}
    </div>
  )
}
