// src/features/chat/components/conversation/MessageList.jsx
// ============================================================
// MessageList (PURE UI)
// ------------------------------------------------------------
// - Receives normalized Message models only
// - Groups messages by contiguous senderActorId
// - Handles scroll anchoring + auto-scroll
// - ZERO DB knowledge
// - ZERO identity resolution
// - Forwards UI intents only
// ============================================================

import React, { useEffect, useMemo, useRef } from 'react'
import MessageGroup from './MessageGroup'

/**
 * Props
 * ------------------------------------------------------------
 * messages: Array<{
 *   id: string
 *   senderActorId: string
 *   body: string | null
 *   mediaUrl: string | null
 *   type: 'text' | 'image' | 'video' | 'file' | 'system'
 *   isEdited: boolean
 *   isDeleted: boolean
 *   isSystem: boolean
 * }>
 *
 * currentActorId: string
 * isGroupChat: boolean
 *
 * statusForMessage?: (messageId: string) => ReactNode
 *
 * onOpenActions?: ({
 *   messageId: string
 *   senderActorId?: string
 *   x: number
 *   y: number
 * }) => void
 */
export default function MessageList({
  messages = [],
  currentActorId,
  isGroupChat,
  statusForMessage,
  onOpenActions,
}) {
  const bottomRef = useRef(null)
  const lastCountRef = useRef(0)

  /* ============================================================
     Group messages by contiguous senderActorId
     ============================================================ */
  const groups = useMemo(() => {
    if (!Array.isArray(messages) || messages.length === 0) {
      return []
    }

    const result = []
    let currentGroup = null

    for (const message of messages) {
      const senderId = message.senderActorId

      if (!currentGroup || currentGroup.senderActorId !== senderId) {
        currentGroup = {
          senderActorId: senderId,
          messages: [],
        }
        result.push(currentGroup)
      }

      currentGroup.messages.push(message)
    }

    return result
  }, [messages])

  /* ============================================================
     Auto-scroll behavior
     ============================================================ */
  useEffect(() => {
    const count = messages.length
    const prev = lastCountRef.current

    if (count === 0 || count > prev) {
      bottomRef.current?.scrollIntoView({
        behavior: prev === 0 ? 'auto' : 'smooth',
      })
    }

    lastCountRef.current = count
  }, [messages])

  return (
    <div
      className="
        flex-1
        overflow-y-auto
        px-3 py-2
        space-y-1
      "
    >
      {groups.map((group, index) => {
        const isMine = group.senderActorId === currentActorId

        return (
          <MessageGroup
            key={`${group.senderActorId}-${index}`}
            messages={group.messages}
            senderActor={group.senderActor} /* resolved upstream */
            isMine={isMine}
            isGroupChat={isGroupChat}
            statusForMessage={statusForMessage}
            onOpenActions={onOpenActions}
          />
        )
      })}

      <div ref={bottomRef} />
    </div>
  )
}
