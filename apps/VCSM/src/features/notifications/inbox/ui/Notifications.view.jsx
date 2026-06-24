import { useTranslation } from '@i18n'
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
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="noti-skeleton-pulse" style={{ height: 12, width: 128, borderRadius: 6 }} />
            <div className="noti-skeleton-pulse" style={{ height: 12, width: 200, maxWidth: '70%', borderRadius: 6 }} />
            <div className="noti-skeleton-pulse" style={{ height: 10, width: 64, borderRadius: 6 }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function NotificationsEndcap() {
  return (
    <div className="noti-endcap">
      <div className="noti-endcap-divider" />
      <div className="noti-endcap-icon" aria-hidden="true">
        {/* sparkle glyph */}
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2.25c.55 5.05 2.45 6.95 7.5 7.5-5.05.55-6.95 2.45-7.5 7.5-.55-5.05-2.45-6.95-7.5-7.5 5.05-.55 6.95-2.45 7.5-7.5Z"
            fill="currentColor"
          />
          <path d="M18.75 3.5c.18 1.4.78 2 2.18 2.18-1.4.18-2 .78-2.18 2.18-.18-1.4-.78-2-2.18-2.18 1.4-.18 2-.78 2.18-2.18Z" fill="currentColor" opacity="0.55" />
        </svg>
      </div>
      <div className="noti-endcap-title">You&rsquo;re all caught up</div>
      <div className="noti-endcap-sub">No more notifications waiting for you.</div>
      <div className="noti-endcap-fade" />
    </div>
  )
}

export default function NotificationsView({ rows, loading }) {
  const { t } = useTranslation()

  if (loading) {
    return <NotificationsSkeleton count={6} />
  }

  if (!rows.length) {
    return (
      <div className="notifications-empty">
        <span style={{ fontSize: 32, lineHeight: 1 }}>🔔</span>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--vc-text-soft)', marginTop: 8 }}>
          {t('notifications.empty.caughtUp')}
        </div>
        <div style={{ fontSize: 12, color: 'var(--vc-text-muted)' }}>
          {t('notifications.empty.newActivity')}
        </div>
      </div>
    )
  }

  return (
    <>
      <ul className="notifications-list">
        {rows.map((n) => (
          <NotificationItem key={n.id} notification={n} />
        ))}
      </ul>
      <NotificationsEndcap />
    </>
  )
}
