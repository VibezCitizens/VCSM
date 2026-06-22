import ActorLink from '@/shared/components/ActorLink'
import { formatRelativeTime, formatExactTimestamp, toISOStringSafe } from '@/shared/lib/formatRelativeTime'

export default function NotificationCard({
  actor,
  message,
  timestamp,
  actions,
  onClick,
  unread = false,
  className = '',
}) {
  const relativeTime = formatRelativeTime(timestamp)
  const exactTime = formatExactTimestamp(timestamp)
  const isoTime = toISOStringSafe(timestamp)
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
          showText={false}
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

          {relativeTime && (
            // Relative label is shown; the exact timestamp stays available via the
            // native tooltip (desktop hover / mobile long-press) and aria-label
            // (screen readers). dateTime gives a machine-readable value.
            <time
              dateTime={isoTime}
              title={exactTime || undefined}
              aria-label={exactTime || undefined}
              style={{ fontSize: 11, color: "var(--vc-text-muted)", marginTop: 2 }}
            >
              {relativeTime}
            </time>
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
