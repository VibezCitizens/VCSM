// src/features/chat/conversation/components/MessageBubble.jsx
// ============================================================
// MessageBubble (PURE UI)
// ============================================================

import { useRef, useMemo } from 'react'
import clsx from 'clsx'
import ActorLink from '@/shared/components/ActorLink'
import MessageMedia from '@/features/chat/conversation/components/MessageMedia'

export default function MessageBubble({
  message,
  senderActor,
  isMine,
  showAvatar = true,
  showName = false,
  statusSlot = null,
  onOpenActions,
  onOpenMedia,
  onRetry,
}) {
  const longPressTimer = useRef(null)

  const timeText = useMemo(() => {
    const createdAt = message?.createdAt
    if (!createdAt) return ''
    const d = createdAt instanceof Date ? createdAt : new Date(createdAt)
    if (Number.isNaN(d.getTime())) return ''
    try {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    } catch {
      return ''
    }
  }, [message?.createdAt])

  if (!message) return null

  /* ============================================================
     System message
     ============================================================ */
  if (message.isSystem) {
    return (
      <div className="my-2 text-center text-xs text-white/40">
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

  const isUploading = !!message.__uploading
  const isFailed = !!message.__failed
  const isPending = !!message.__optimistic && !isFailed

  const isMediaOnly = (!!message.mediaUrl || isUploading) && !message.body

  const showTextTimestamp = !!timeText && !!message.body && !message.isDeleted

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const startLongPress = (targetEl) => {
    clearLongPress()
    longPressTimer.current = setTimeout(() => {
      openAtElement(targetEl)
    }, 500)
  }

  return (
    <div
      className={clsx(
        'chat-modern-message-row flex items-end gap-2',
        isMine ? 'justify-end' : 'justify-start',
        isPending && 'opacity-65',
        isFailed && 'opacity-80',
      )}
    >
      {/* Avatar slot — only rendered when actor is present.
          No actor → no slot on any message in the group (flush left).
          Actor present → last message shows avatar, others show spacer for alignment. */}
      {!isMine && actor && (
        showAvatar
          ? <div className="shrink-0 w-7 pointer-events-none">
              <ActorLink
                actor={actor}
                avatarSize="w-7 h-7"
                textSize="text-xs"
                className="pointer-events-none"
              />
            </div>
          : <div className="w-7" />
      )}

      {/* Message bubble */}
      <div className="chat-modern-message-col max-w-[78%]">
        {/* Name (group chats) */}
        {!isMine && showName && actor && (
          <div className="mb-0.5 text-xs text-white/50 truncate">
            {actor.displayName}
          </div>
        )}

        {/* Bubble */}
        <div
          className={clsx(
            'text-sm break-words no-ios-callout chat-modern-bubble', // ✅ stop iOS callout/selection
            // ❌ removed select-text (this is what triggers iOS Copy/LookUp)
            // !message.isDeleted && 'select-text',

            // ✅ media-only messages should NOT render a purple bubble container
            isMediaOnly
              ? 'chat-modern-bubble--media p-0 bg-transparent'
              : [
                  'rounded-2xl px-3 py-2',
                  isMine
                    ? 'chat-modern-bubble--mine bg-purple-600 text-white rounded-br-md'
                    : 'chat-modern-bubble--other bg-purple-500 text-white rounded-bl-md',
                ]
          )}
          // ✅ never allow native context menu (desktop right-click + iOS long-press callout)
          onContextMenu={(e) => {
            e.preventDefault()
            openAtElement(e.currentTarget)
          }}
          // ✅ mobile long press (iOS/Android)
          onTouchStart={(e) => {
            const target = e.currentTarget
            startLongPress(target)
          }}
          onTouchEnd={clearLongPress}
          onTouchMove={clearLongPress}
          onTouchCancel={clearLongPress}
          // ✅ pointer fallback (desktop / some mobile browsers)
          onPointerDown={(e) => {
            // only start long-press for touch/pen; mouse right click already handled by contextmenu
            if (e.pointerType === 'touch' || e.pointerType === 'pen') {
              startLongPress(e.currentTarget)
            }
          }}
          onPointerUp={clearLongPress}
          onPointerCancel={clearLongPress}
          onPointerMove={clearLongPress}
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
              {/* uploading placeholder — no URL yet */}
              {isUploading && !message.mediaUrl && (
                <div className="w-36 h-36 rounded-xl bg-white/10 flex items-center justify-center">
                  <span className="text-white/40 text-xs">Uploading…</span>
                </div>
              )}

              {message.mediaUrl && (
                <MessageMedia
                  type={message.type}
                  url={message.mediaUrl}
                  isMine={isMine}
                  createdAt={message.createdAt}
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

              {/* ✅ timestamp for text messages (bottom-right inside bubble) */}
              {showTextTimestamp && (
                <div className="mt-1 flex justify-end">
                  <span className="text-[10px] leading-none text-white/75">
                    {timeText}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Status (mine only) */}
        {isMine && statusSlot && (
          <div className="mt-0.5 text-right text-[10px] text-white/50">
            {statusSlot}
          </div>
        )}

        {/* Optimistic states */}
        {isMine && isUploading && (
          <div className="mt-0.5 text-right text-[10px] text-white/35">
            Uploading…
          </div>
        )}
        {isMine && isPending && !isUploading && (
          <div className="mt-0.5 text-right text-[10px] text-white/35">
            Sending…
          </div>
        )}
        {isMine && isFailed && (
          <div className="mt-0.5 text-right">
            <button
              type="button"
              onClick={() => onRetry?.(message.clientId || message.id)}
              className="text-[11px] text-rose-400 active:text-rose-300"
            >
              Failed · Retry
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
