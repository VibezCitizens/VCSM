// VERSION: 2025-11-11 (adds debug on trash click)

import React from 'react'
import { Trash2 } from 'lucide-react'

export default function CardInbox({ conversation, onClick, onDelete }) {
  const {
    partner_photo_url,
    partner_display_name,
    partner_username,
    last_message_preview,
    unread_count,
  } = conversation

  const hasUnread = (unread_count ?? 0) > 0

  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-3 border-b cursor-pointer transition-all duration-300 
        ${hasUnread
          ? 'bg-black/80 border-cyan-400 shadow-[0_0_15px_3px_rgba(0,255,255,0.5)]'
          : 'border-white/10 hover:bg-white/10'
        }`}
      data-conversation-id={conversation.id}
    >
      {/* Left: avatar + text */}
      <div className="flex items-center gap-3">
        <img
          src={partner_photo_url || '/default-avatar.png'}
          alt="profile"
          className={`w-12 h-12 rounded-md object-cover transition-all duration-300 ${
            hasUnread
              ? 'ring-2 ring-cyan-400 shadow-[0_0_10px_2px_rgba(0,255,255,0.6)]'
              : 'bg-white/10'
          }`}
        />
        <div className="flex flex-col">
          <span className="text-white font-semibold">
            {partner_display_name || partner_username || 'Unknown'}
          </span>
          <span
            className={`text-sm truncate max-w-[200px] ${
              hasUnread ? 'text-cyan-400 font-medium' : 'text-white/60'
            }`}
            title={last_message_preview || ''}
          >
            {last_message_preview || 'No messages yet'}
          </span>
        </div>
      </div>

      {/* Right: delete + unread badge */}
      <div className="flex items-center gap-3">
        {hasUnread && (
          <span className="text-cyan-400 text-xs font-semibold animate-pulse">
            NEW
          </span>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Debug: trace the exact click and payload
              console.groupCollapsed('[CardInbox] trash click')
              console.log('conversationId:', conversation.id)
              console.log('partner:', partner_display_name || partner_username || 'Unknown')
              console.log('preview:', last_message_preview || '')
              console.groupEnd()
              onDelete(conversation.id)
            }}
            className="p-2 rounded-lg hover:bg-red-500/20 text-white"
            aria-label="Delete conversation (for me)"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
