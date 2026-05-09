// src/features/chat/conversation/adapters/MessageRow.jsx

import MessageBubble from '../components/MessageBubble'
import MessageActionsMenu from '../components/MessageActionsMenu'

export default function MessageRow({
  message,
  senderActor,
  isMine,

  // intent callbacks (NO DB)
  onRequestEdit,
  onRequestUnsend,
  onRequestDeleteForMe,
}) {
  const canEdit = isMine && !message.isDeleted
  const canUnsend = isMine && !message.isDeleted
  const canDeleteForMe = true

  return (
    <div className="relative group">
      <MessageBubble
        message={message}
        senderActor={senderActor}
        isMine={isMine}
      />

      <MessageActionsMenu
        canEdit={canEdit}
        canUnsend={canUnsend}
        canDeleteForMe={canDeleteForMe}
        onEdit={() => onRequestEdit?.(message)}
        onUnsend={() => onRequestUnsend?.(message)}
        onDeleteForMe={() => onRequestDeleteForMe?.(message)}
      />
    </div>
  )
}
