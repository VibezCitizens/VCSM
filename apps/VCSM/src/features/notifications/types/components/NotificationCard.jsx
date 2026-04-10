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
      className={`
        notifications-card
        flex items-center justify-between gap-3
        rounded-xl px-4 py-3
        ${unread ? 'notifications-card--unread' : ''}
        ${isClickable ? 'cursor-pointer active:scale-[0.985] transition-transform duration-100' : ''}
        ${className}
      `}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter') onClick() } : undefined}
    >
      <div className="flex min-w-0 items-center gap-3">
        <ActorLink
          actor={actor}
          avatarSize="w-11 h-11"
          textSize="hidden"
          showUsername={false}
          showTimestamp={false}
          className="shrink-0"
        />

        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-medium" style={{ color: 'var(--vc-text)' }}>
            {actor?.displayName || actor?.username || 'Someone'}
          </span>

          <span className="truncate text-sm" style={{ color: 'var(--vc-text-soft)' }}>
            {message}
          </span>

          {time && (
            <span className="mt-0.5 text-[11px]" style={{ color: 'var(--vc-text-muted)' }}>
              {time}
            </span>
          )}
        </div>
      </div>

      {/* Only render action buttons (Accept/Decline) — no View button */}
      {actions && (
        <div
          className="flex shrink-0 items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </div>
  )
}
