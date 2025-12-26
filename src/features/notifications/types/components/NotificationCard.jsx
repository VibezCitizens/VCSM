import ActorLink from '@/shared/components/ActorLink'
import { formatTimestamp } from '@/shared/lib/formatTimestamp'

export default function NotificationCard({
  actor,
  message,
  timestamp,

  // NEW
  actions,              // JSX node(s): Accept / Decline
  secondaryAction,      // { label, onClick }

  // LEGACY (still supported)
  actionLabel,
  onAction,

  unread = false,
  className = '',
}) {
  const time = formatTimestamp(timestamp)

  return (
    <div
      className={`
        flex items-center justify-between gap-3
        px-4 py-3 rounded-xl
        bg-neutral-900/80
        border border-neutral-800
        ${unread ? 'ring-1 ring-neutral-700' : ''}
        ${className}
      `}
    >
      {/* LEFT */}
      <div className="flex items-center gap-3 min-w-0">
        <ActorLink
          actor={actor}
          avatarSize="w-11 h-11"
          avatarShape="rounded-xl"
          textSize="hidden"
          showUsername={false}
          showTimestamp={false}
          className="shrink-0"
        />

        <div className="flex flex-col min-w-0 leading-tight">
          <span className="text-sm text-white font-medium truncate">
            {actor?.displayName || actor?.username || 'Someone'}
          </span>

          <span className="text-sm text-neutral-300 truncate">
            {message}
          </span>

          {time && (
            <span className="text-[11px] text-neutral-500 mt-0.5">
              {time}
            </span>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Inline action buttons (Accept / Decline) */}
        {actions}

        {/* Secondary action (View, Open, etc.) */}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="
              text-xs text-neutral-300
              px-3 py-1 rounded-lg
              bg-neutral-800 hover:bg-neutral-700
            "
          >
            {secondaryAction.label}
          </button>
        )}

        {/* Legacy single action support */}
        {!actions && actionLabel && onAction && (
          <button
            onClick={onAction}
            className="
              text-xs text-neutral-300
              px-3 py-1 rounded-lg
              bg-neutral-800 hover:bg-neutral-700
            "
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
