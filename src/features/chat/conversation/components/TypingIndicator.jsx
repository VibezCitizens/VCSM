// src/features/chat/components/conversation/TypingIndicator.jsx
// ============================================================
// TypingIndicator
// ------------------------------------------------------------
// - Pure UI component
// - Actor-agnostic
// - Expects presentation-safe actors
// - Works for DM and group chats
// ============================================================

import clsx from 'clsx'
import ActorLink from '@/shared/components/ActorLink'

/**
 * Props
 * ------------------------------------------------------------
 * actors: Array<{
 *   id: uuid
 *   kind: 'user' | 'vport' | 'void'
 *   displayName: string
 *   username?: string
 *   avatar: string
 *   route: string
 * }>
 *
 * compact?: boolean
 * align?: 'left' | 'right'
 */
export default function TypingIndicator({
  actors = [],
  compact = false,
  align = 'left',
}) {
  if (!Array.isArray(actors) || actors.length === 0) return null

  const names = actors
    .map((a) => a?.displayName || a?.username || 'Someone')
    .slice(0, 3)

  const label =
    actors.length === 1
      ? `${names[0]} is typing`
      : actors.length === 2
        ? `${names[0]} and ${names[1]} are typing`
        : `${names[0]}, ${names[1]} and others are typing`

  return (
    <div
      className={clsx(
        'flex items-center gap-2 px-3 py-1',
        align === 'right' ? 'justify-end' : 'justify-start'
      )}
      aria-live="polite"
      aria-label={label}
    >
      {!compact && (
        <div className="flex items-center gap-1">
          {actors.slice(0, 3).map((actor) => (
            <ActorLink
              key={actor.id}
              actor={actor}
              avatarSize="w-5 h-5"
              avatarShape="rounded-full"
              textSize="text-xs"
              className="pointer-events-none"
            />
          ))}
        </div>
      )}

      {!compact && (
        <span className="text-xs text-neutral-400 truncate max-w-[60%]">
          {label}
        </span>
      )}

      <TypingDots />
    </div>
  )
}

/* ============================================================
   Typing dots animation
   ============================================================ */

function TypingDots() {
  return (
    <span className="flex gap-1">
      <Dot delay="0ms" />
      <Dot delay="150ms" />
      <Dot delay="300ms" />
    </span>
  )
}

function Dot({ delay }) {
  return (
    <span
      className="
        inline-block
        h-1.5 w-1.5
        rounded-full
        bg-neutral-500
        animate-bounce
      "
      style={{ animationDelay: delay }}
    />
  )
}
