import ActorLink from '@/shared/components/ActorLink'
import { formatTimestamp } from '@/shared/lib/formatTimestamp'

export default function NotificationCard({
  actor,
  message,
  timestamp,
  actions,
  onClick,
  unread = false,
  className = '',
}) {
  const time = formatTimestamp(timestamp)
  const isClickable = typeof onClick === 'function'

  return (
    <div
      className={`notifications-card ${unread ? 'notifications-card--unread' : ''} ${className}`}
      style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter') onClick() } : undefined}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
        <ActorLink
          actor={actor}
          avatarSize="w-11 h-11"
          textSize="hidden"
          showUsername={false}
          showTimestamp={false}
          className="shrink-0"
        />

        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, lineHeight: 1.35 }}>
          <span
            style={{ fontSize: 13, fontWeight: 600, color: "var(--vc-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {actor?.displayName || actor?.username || 'Someone'}
          </span>

          <span
            style={{ fontSize: 13, color: "var(--vc-text-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {message}
          </span>

          {time && (
            <span style={{ fontSize: 11, color: "var(--vc-text-muted)", marginTop: 2 }}>
              {time}
            </span>
          )}
        </div>
      </div>

      {actions && (
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </div>
  )
}
