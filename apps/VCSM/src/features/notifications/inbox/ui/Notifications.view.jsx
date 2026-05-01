import NotificationItem from './NotificationItem.view'

function NotificationsSkeleton({ count = 6 }) {
  return (
    <ul className="notifications-list" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <li key={`noti-skeleton:${i}`} className="noti-skeleton-item">
          <div
            className="noti-skeleton-pulse"
            style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="noti-skeleton-pulse" style={{ height: 12, width: 128, borderRadius: 6 }} />
            <div className="noti-skeleton-pulse" style={{ height: 12, width: 200, maxWidth: "70%", borderRadius: 6 }} />
            <div className="noti-skeleton-pulse" style={{ height: 10, width: 64, borderRadius: 6 }} />
          </div>
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
    return (
      <div className="notifications-empty">
        <span style={{ fontSize: 32, lineHeight: 1 }}>🔔</span>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--vc-text-soft)", marginTop: 8 }}>
          You're all caught up
        </div>
        <div style={{ fontSize: 12, color: "var(--vc-text-muted)" }}>
          New activity will appear here.
        </div>
      </div>
    )
  }

  return (
    <ul className="notifications-list">
      {rows.map((n) => (
        <NotificationItem key={n.id} notification={n} />
      ))}
    </ul>
  )
}
