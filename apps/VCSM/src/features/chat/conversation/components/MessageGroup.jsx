// src/features/chat/components/conversation/MessageGroup.jsx

import React from 'react'
import MessageBubble from './MessageBubble'

export default function MessageGroup({
  messages = [],
  senderActor,
  isMine,
  isGroupChat,
  statusForMessage,
  onOpenActions,
  onOpenMedia, // ✅ add
}) {
  if (!Array.isArray(messages) || messages.length === 0) return null

  return (
    <div className="flex flex-col gap-1 my-1">
      {messages.map((message, index) => {
        const isFirst = index === 0
        const isLast = index === messages.length - 1

        return (
          <MessageBubble
            key={`${message.id}:${message.isDeleted ? 'deleted' : 'alive'}`}
            message={message}
            senderActor={senderActor}
            isMine={isMine}
            showAvatar={!isMine && isLast}
            showName={!isMine && isGroupChat && isFirst}
            statusSlot={
              isMine && isLast && statusForMessage
                ? statusForMessage(message.id)
                : null
            }
            onOpenActions={onOpenActions}
            onOpenMedia={onOpenMedia} // ✅ add
          />
        )
      })}
    </div>
  )
}
