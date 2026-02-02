// ============================================================
// InboxItem
// ------------------------------------------------------------
// - Pure UI component
// - Actor-agnostic
// - Renders a single Vox row
// - Consumes CAMELCASE inbox preview objects
// ============================================================

import clsx from 'clsx'
import { Pin, BellOff } from 'lucide-react'

import ActorLink from '@/shared/components/ActorLink'
import ConversationSignalIcon from '@/shared/components/ConversationSignalIcon'

/**
 * Props
 * ------------------------------------------------------------
 * entry: {
 *   conversationId: uuid
 *   unreadCount: number
 *   pinned: boolean
 *   muted: boolean
 *   archived: boolean
 *
 *   partnerActorId?: uuid
 *   partnerKind?: 'user' | 'vport' | 'void'
 *   partnerDisplayName?: string
 *   partnerUsername?: string
 *   partnerPhotoUrl?: string
 *   partnerRoute?: string
 *
 *   preview?: string
 * }
 *
 * active?: boolean
 * onClick?: () => void
 * onContextMenu?: (event) => void
 */
export default function InboxItem({
  entry,
  active = false,
  onClick,
  onContextMenu,
}) {
  if (!entry) return null

  const {
    unreadCount = 0,
    pinned = false,
    muted = false,
    archived = false,

    partnerActorId,
    partnerKind,
    partnerDisplayName,
    partnerUsername,
    partnerPhotoUrl,
    partnerRoute,

    preview,
  } = entry

  const title =
    partnerDisplayName ||
    (partnerUsername ? `@${partnerUsername}` : 'Vox')

  // Build presentation-safe actor for ActorLink
  const actor =
    partnerActorId
      ? {
          id: partnerActorId,
          kind: partnerKind,
          displayName: partnerDisplayName || 'Vox',
          username: partnerUsername,
          avatar: partnerPhotoUrl || '/avatar.jpg',
          route: partnerRoute || '#',
        }
      : null

  return (
    <button
      type="button"
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={clsx(
        'w-full text-left',
        'px-3 py-2',
        'flex items-center gap-3',
        'transition',
        active
          ? 'bg-neutral-800'
          : 'hover:bg-neutral-900',
        archived && 'opacity-60'
      )}
    >
      {/* Avatar */}
      <div className="shrink-0 pointer-events-none relative">
        {actor && (
          <ActorLink
            actor={actor}
            avatarSize="w-11 h-11"
            avatarShape="rounded-full"
            className="pointer-events-none"
          />
        )}

        {/* Vox signal */}
        {unreadCount > 0 && (
          <div className="absolute -bottom-1 -right-1">
            <ConversationSignalIcon
              size={14}
              className="text-blue-500"
            />
          </div>
        )}
      </div>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Top row */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={clsx(
              'truncate text-sm',
              unreadCount > 0
                ? 'font-semibold text-neutral-100'
                : 'text-neutral-300'
            )}
          >
            {title}
          </span>

          {/* Meta icons */}
          <div className="flex items-center gap-1">
            {pinned && (
              <Pin size={12} className="text-neutral-400" />
            )}
            {muted && (
              <BellOff size={12} className="text-neutral-500" />
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span
            className={clsx(
              'text-xs truncate',
              unreadCount > 0
                ? 'text-neutral-300'
                : 'text-neutral-500'
            )}
          >
            {preview || ' '}
          </span>

          {/* Unread badge */}
          {unreadCount > 0 && (
            <span
              className="
                min-w-[18px] h-[18px]
                px-1
                flex items-center justify-center
                rounded-full
                bg-blue-600
                text-[10px]
                text-white
                font-medium
              "
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
