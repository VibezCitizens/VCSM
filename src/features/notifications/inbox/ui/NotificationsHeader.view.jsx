import { useIdentity } from '@/state/identity/identityContext'

export default function NotificationsHeader({ unreadCount, onMarkAllSeen }) {
  const { identity } = useIdentity()
  const isVport = identity?.kind === 'vport'

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-300/10 bg-[#070b16]/75 px-4 py-3 backdrop-blur">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-slate-100">
          {isVport ? 'Vport Notifications' : 'Notifications'}
          {unreadCount > 0 && ` (${unreadCount})`}
        </h1>

        {isVport && <span className="text-xs text-slate-400">Acting as {identity.displayName}</span>}
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
