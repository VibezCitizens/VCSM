// src/features/chat/components/conversation/MessageGroup.jsx
// ============================================================
// MessageGroup
// ------------------------------------------------------------
// - Pure UI component
// - Renders a contiguous group of messages from the SAME sender
// - Handles avatar + name display rules
// - Delegates rendering to MessageBubble
// - Forwards UI intents only
// ============================================================

import React from 'react'
import MessageBubble from './MessageBubble'

/**
 * Props
 * ------------------------------------------------------------
 * messages: Array<{
 *   id: string
 *   body?: string | null
 *   mediaUrl?: string | null
 *   type: 'text' | 'image' | 'video' | 'file' | 'system'
 *   isEdited: boolean
 *   isDeleted: boolean
 *   isSystem: boolean
 * }>
 *
 * senderActor?: {
 *   id: string
 *   kind: 'user' | 'vport' | 'void'
 *   displayName: string
 *   username?: string
 *   avatar?: string
 *   route?: string
 * }
 *
 * isMine: boolean
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
export default function MessageGroup({
  messages = [],
  senderActor,
  isMine,
  isGroupChat,
  statusForMessage,
  onOpenActions,
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
/>

        )
      })}
    </div>
  )
}
