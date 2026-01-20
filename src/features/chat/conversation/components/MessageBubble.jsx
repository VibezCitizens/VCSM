// src/features/chat/conversation/components/MessageBubble.jsx
// ============================================================
// MessageBubble (PURE UI)
// ============================================================

import { useRef } from 'react'
import clsx from 'clsx'
import ActorLink from '@/shared/components/ActorLink'

export default function MessageBubble({
  message,
  senderActor,
  isMine,
  showAvatar = true,
  showName = false,
  statusSlot = null,
  onOpenActions,
  onOpenMedia,
}) {
  if (!message) return null

  const longPressTimer = useRef(null)

  /* ============================================================
     System message
     ============================================================ */
  if (message.isSystem) {
    return (
      <div className="my-2 text-center text-xs text-neutral-500">
        {message.body}
      </div>
    )
  }

  /* ============================================================
     Actor presentation (UI-safe)
     ============================================================ */
  const actor = senderActor
    ? {
        id: senderActor.id,
        kind: senderActor.kind,
        displayName: senderActor.displayName,
        username: senderActor.username,
        avatar: senderActor.avatar || '/avatar.jpg',
        route: senderActor.route || '#',
      }
    : null

  /* ============================================================
     Open actions menu (UI intent only)
     ============================================================ */
  const openAtElement = (el) => {
    if (!el) return

    const rect = el.getBoundingClientRect()

    onOpenActions?.({
      messageId: message.id,
      senderActorId: message.senderActorId,
      anchorRect: rect,
    })
  }

  const isMediaOnly = !!message.mediaUrl && !message.body

  return (
    <div
      className={clsx(
        'flex items-end gap-2',
        isMine ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Avatar (left only) */}
      {!isMine && showAvatar ? (
        <div className="shrink-0 pointer-events-none">
          {actor && (
            <ActorLink
              actor={actor}
              avatarSize="w-7 h-7"
              avatarShape="rounded-full"
              textSize="text-xs"
              className="pointer-events-none"
            />
          )}
        </div>
      ) : (
        !isMine && <div className="w-7" />
      )}

      {/* Message bubble */}
      <div className="max-w-[78%]">
        {/* Name (group chats) */}
        {!isMine && showName && actor && (
          <div className="mb-0.5 text-xs text-neutral-400 truncate">
            {actor.displayName}
          </div>
        )}

        {/* Bubble */}
        <div
          className={clsx(
            'text-sm break-words',
            !message.isDeleted && 'select-text',

            // ✅ media-only messages should NOT render a purple bubble container
            isMediaOnly
              ? 'p-0 bg-transparent'
              : [
                  'rounded-2xl px-3 py-2',
                  isMine
                    ? 'bg-purple-600 text-white rounded-br-md'
                    : 'bg-purple-500 text-white rounded-bl-md',
                ]
          )}
          onContextMenu={(e) => {
            e.preventDefault()
            openAtElement(e.currentTarget)
          }}
          onTouchStart={(e) => {
            const target = e.currentTarget
            longPressTimer.current = setTimeout(() => {
              openAtElement(target)
            }, 500)
          }}
          onTouchEnd={() => {
            clearTimeout(longPressTimer.current)
          }}
          onTouchMove={() => {
            clearTimeout(longPressTimer.current)
          }}
        >
          {/* 🔒 HARD VISUAL GUARD — deleted is terminal */}
          {message.isDeleted && (
            <span className="italic opacity-70 select-none">
              Message deleted
            </span>
          )}

          {/* NEVER mount content once deleted */}
          {!message.isDeleted && (
            <>
              {message.mediaUrl && (
  <MediaBlock
    type={message.type}
    url={message.mediaUrl}
    onOpen={() =>
      onOpenMedia?.({
        url: message.mediaUrl,
        type: message.type,
      })
    }
  />
)}


              {message.body && (
                <span className="whitespace-pre-wrap">
                  {message.body}
                </span>
              )}

              {message.isEdited && (
                <span className="ml-2 text-[10px] opacity-70">
                  (edited)
                </span>
              )}
            </>
          )}
        </div>

        {/* Status (mine only) */}
        {isMine && statusSlot && (
          <div className="mt-0.5 text-right text-[10px] text-neutral-400">
            {statusSlot}
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================
   Media renderer (UI only)
   ============================================================ */

function MediaBlock({ type, url, onOpen }) {
  switch (type) {
    case 'image':
      return (
        <img
          src={url}
          alt=""
          onClick={onOpen}
          className="mb-1 w-full max-w-full rounded-xl cursor-pointer active:opacity-90"
        />
      )


    case 'video':
      return (
        <video
          src={url}
          controls
          className="mb-1 w-full max-w-full rounded-xl"
        />
      )

    case 'file':
      return (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mb-1 block underline text-xs"
        >
          Download file
        </a>
      )

    default:
      return null
  }
}
