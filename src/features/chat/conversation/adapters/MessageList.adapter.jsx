// src/features/chat/conversation/adapters/MessageList.adapter.jsx
// ============================================================
// MessageListAdapter
// ------------------------------------------------------------
// - Adapter boundary between Screen and UI
// - Groups messages by senderActorId
// - Injects infra (actorId, supabase)
// - Delegates action wiring to MessageGroupAdapter
// - NO JSX primitives beyond layout
// ============================================================

import React, { useMemo } from 'react'
import MessageGroupAdapter from './MessageGroup.adapter'

export default function MessageListAdapter({
  messages = [],
  currentActorId,
  isGroupChat,

  // infrastructure (from Screen)
  actorId,
  supabase,

  // lifecycle hooks
  onEdited,
  onDeleted,
}) {
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

  if (groups.length === 0) return null

  return (
    <div className="flex flex-col space-y-1">
      {groups.map((group, index) => (
        <MessageGroupAdapter
          key={`${group.senderActorId}-${index}`}
          messages={group.messages}
          senderActor={group.senderActorId}
          currentActorId={currentActorId}

          /* infra */
          actorId={actorId}
          supabase={supabase}

          /* lifecycle */
          onEdited={onEdited}
          onDeleted={onDeleted}
        />
      ))}
    </div>
  )
}
