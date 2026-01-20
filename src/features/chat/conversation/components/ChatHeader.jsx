// src/features/chat/components/conversation/ChatHeader.jsx
// ============================================================
// ChatHeader
// ------------------------------------------------------------
// - Pure UI component
// - Actor-based
// - Sticky header (mobile + desktop)
// - Uses shared ActorLink
// ============================================================

import React from 'react'
import { ChevronLeft, MoreVertical } from 'lucide-react'

import ActorLink from '@/shared/components/ActorLink'

export default function ChatHeader({
  conversation,
  partnerActor,
  onBack,
  onOpenMenu, // ✅ renamed (anchorRect menu)
}) {
  if (!conversation) return null

  const isGroup = Boolean(conversation.isGroup)

  /* ------------------------------------------------------------
     Build ActorLink-compatible object
     ------------------------------------------------------------ */
  const actorLink =
    !isGroup && partnerActor
      ? {
          id: partnerActor.actorId,
          kind: partnerActor.kind,
          displayName: partnerActor.displayName || partnerActor.username || 'User',
          username: partnerActor.username,
          avatar: partnerActor.photoUrl || '/avatar.jpg',
          route:
            partnerActor.kind === 'vport'
              ? `/vport/${partnerActor.username}`
              : `/profile/${partnerActor.username}`,
        }
      : null

  const title = isGroup
    ? conversation.title || 'Group Chat'
    : actorLink?.displayName || 'Conversation'

  return (
    <header
      className="
        sticky top-0 z-20
        bg-black/90 backdrop-blur
        border-b border-white/10
      "
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div
        className="
          h-14 px-3
          flex items-center justify-between
          gap-2 text-white
        "
      >
        {/* LEFT */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Back */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="
                p-2 -ml-1 rounded-xl
                text-violet-400
                hover:bg-violet-500/15
                active:bg-violet-500/25
                transition
              "
              aria-label="Back"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Avatar + Name */}
          {isGroup ? (
            <div
              className="
                h-10 w-10
                rounded-xl bg-white/10
                flex items-center justify-center
                font-semibold uppercase
              "
            >
              {title?.charAt(0) || 'G'}
            </div>
          ) : (
            <ActorLink
              actor={actorLink}
              avatarSize="w-10 h-10"
              avatarShape="rounded-xl"
              textSize="text-sm"
              showUsername
              className="min-w-0"
            />
          )}
        </div>

        {/* RIGHT */}
        <button
          type="button"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            onOpenMenu?.(rect)
          }}
          className="
            p-2 rounded-xl
            text-white/70
            hover:text-white
            hover:bg-white/10
            transition
          "
          aria-label="Conversation options"
        >
          <MoreVertical size={22} />
        </button>
      </div>
    </header>
  )
}
