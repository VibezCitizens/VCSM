// src/features/chat/components/conversation/MessageList.jsx

import React, { useEffect, useMemo, useRef } from 'react'
import MessageGroup from './MessageGroup'

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
     Auto-scroll on new messages
     ============================================================ */
  useEffect(() => {
    const count = messages.length
    const prev = lastCountRef.current

    if (count === 0 || count > prev) {
      bottomRef.current?.scrollIntoView({
        behavior: prev === 0 ? 'auto' : 'smooth',
        block: 'end',
      })
    }

    lastCountRef.current = count
  }, [messages])

  /* ============================================================
     iOS keyboard re-anchor (CRITICAL)
     ============================================================ */
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const onResize = () => {
      bottomRef.current?.scrollIntoView({
        behavior: 'auto',
        block: 'end',
      })
    }

    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className="px-3 py-2 space-y-1">
      {groups.map((group, index) => {
        const isMine = group.senderActorId === currentActorId

        return (
          <MessageGroup
            key={`${group.senderActorId}-${index}`}
            messages={group.messages}
            senderActor={group.senderActor}
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
