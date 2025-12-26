// ============================================================
// InboxList DELL
// ------------------------------------------------------------
// - Pure list renderer
// - Requires stable keys (conversationId)
// - No actor logic
// ============================================================

import React from 'react'
import CardInbox from './CardInbox' // ✅ USE NEW CARD

export default function InboxList({
  entries = [],
  activeConversationId = null, // (kept for future)
  onSelect,
  onContextMenu,
  onDelete,
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
          />
        )
      })}
    </div>
  )
}
