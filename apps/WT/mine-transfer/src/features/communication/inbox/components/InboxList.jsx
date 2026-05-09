import React from 'react'
import CardInbox from './CardInbox'

export default function InboxList({ entries = [], onSelect, onDelete, showThreadPreview = true }) {
  if (!Array.isArray(entries) || entries.length === 0) return null

  return (
    <div className="space-y-2 px-2 py-2">
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
