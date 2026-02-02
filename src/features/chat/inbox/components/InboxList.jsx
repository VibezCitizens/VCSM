// src/features/chat/inbox/components/InboxList.jsx
import React from 'react'
import CardInbox from './CardInbox'

export default function InboxList({
  entries = [],
  activeConversationId = null,
  onSelect,
  onContextMenu,
  onDelete,

  // ✅ ONLY PREVIEW TOGGLE
  showThreadPreview = true,
}) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return null
  }

  return (
    <div className="divide-y divide-neutral-800">
      {entries.map((entry) => {
        if (!entry?.conversationId) return null

        return (
          <CardInbox
            key={entry.conversationId}
            entry={entry}
            onClick={() => onSelect?.(entry.conversationId)}
            onDelete={onDelete}
            showThreadPreview={showThreadPreview}
          />
        )
      })}
    </div>
  )
}
