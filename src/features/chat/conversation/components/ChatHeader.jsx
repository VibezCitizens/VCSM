import React from 'react'
import { ChevronLeft, MoreVertical } from 'lucide-react'

import ActorLink from '@/shared/components/ActorLink'

export default function ChatHeader({ conversation, partnerActor, onBack, onOpenMenu }) {
  if (!conversation) return null

  const isGroup = Boolean(conversation.isGroup)

  const actorLink =
    !isGroup && partnerActor
      ? {
          id: partnerActor.actorId,
          kind: partnerActor.kind,
          displayName: partnerActor.displayName || partnerActor.username || 'User',
          username: partnerActor.username,
          avatar: partnerActor.photoUrl || '/avatar.jpg',
          route: `/profile/${partnerActor.actorId}`,
        }
      : null

  const title = isGroup ? conversation.title || 'Group Chat' : actorLink?.displayName || 'Conversation'

  return (
    <header
      className="sticky top-0 z-20 border-b border-slate-300/10 bg-[#070b16]/75 backdrop-blur"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex h-14 items-center justify-between gap-2 px-3 text-slate-100">
        <div className="flex min-w-0 items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="-ml-1 p-2 text-indigo-300 transition hover:text-indigo-200"
              aria-label="Back"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {isGroup ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700/70 font-semibold uppercase">
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

        <button
          type="button"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            onOpenMenu?.(rect)
          }}
          className="p-2 text-slate-200 transition hover:text-slate-100"
          aria-label="Conversation options"
        >
          <MoreVertical size={22} />
        </button>
      </div>
    </header>
  )
}
