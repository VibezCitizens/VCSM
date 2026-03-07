import NotificationItem from './NotificationItem.view'

function NotificationsSkeleton({ count = 6 }) {
  return (
    <ul className="notifications-list" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={`noti-skeleton:${i}`}
          className="notifications-card flex items-center justify-between gap-3 rounded-xl px-4 py-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-slate-700/45" />

            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-slate-700/45" />
              <div className="h-3 w-52 max-w-[70vw] animate-pulse rounded bg-slate-700/35" />
              <div className="h-2 w-16 animate-pulse rounded bg-slate-700/30" />
            </div>
          </div>

          <div className="h-7 w-14 animate-pulse rounded-md bg-slate-700/35" />
        </li>
      ))}
    </ul>
  )
}

export default function NotificationsView({ rows, loading }) {
  if (loading) {
    return <NotificationsSkeleton count={6} />
  }

  if (!rows.length) {
    return <div className="notifications-empty">No notifications</div>
  }

  return (
    <ul className="notifications-list">
      {rows.map((n) => (
        <NotificationItem key={n.id} notification={n} />
      ))}
    </ul>
  )
}
