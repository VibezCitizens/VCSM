import ActorLink from '@/shared/components/ActorLink'
import { formatTimestamp } from '@/shared/lib/formatTimestamp'

export default function NotificationCard({
  actor,
  message,
  timestamp,
  actions,
  secondaryAction,
  actionLabel,
  onAction,
  unread = false,
  className = '',
}) {
  const time = formatTimestamp(timestamp)

  return (
    <div
      className={`
        module-modern-card
        flex items-center justify-between gap-3
        rounded-xl px-4 py-3
        ${unread ? 'ring-1 ring-indigo-300/35' : ''}
        ${className}
      `}
    >
      <div className="flex min-w-0 items-center gap-3">
        <ActorLink
          actor={actor}
          avatarSize="w-11 h-11"
          avatarShape="rounded-xl"
          textSize="hidden"
          showUsername={false}
          showTimestamp={false}
          className="shrink-0"
        />

        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-medium text-slate-100">
            {actor?.displayName || actor?.username || 'Someone'}
          </span>

          <span className="truncate text-sm text-slate-300">{message}</span>

          {time && <span className="mt-0.5 text-[11px] text-slate-500">{time}</span>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {actions}

        {secondaryAction && (
          <button onClick={secondaryAction.onClick} className="module-modern-btn module-modern-btn--ghost px-3 py-1 text-xs">
            {secondaryAction.label}
          </button>
        )}

        {!actions && actionLabel && onAction && (
          <button onClick={onAction} className="module-modern-btn module-modern-btn--ghost px-3 py-1 text-xs">
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
