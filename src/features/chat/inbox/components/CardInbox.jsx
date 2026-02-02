// src/features/chat/inbox/components/CardInbox.jsx
import React from 'react'
import { Trash2 } from 'lucide-react'

export default function CardInbox({
  entry,
  onClick,
  onDelete,
  showThreadPreview = true,
}) {
  if (!entry) return null

  const {
    conversationId,
    unreadCount = 0,
    partnerDisplayName,
    partnerUsername,
    partnerPhotoUrl,
    preview,
  } = entry

  const hasUnread = unreadCount > 0

  return (
    <div
      onClick={onClick}
      data-conversation-id={conversationId}
      className="
        mx-3 mt-3
        rounded-2xl
        bg-white/5
        hover:bg-white/10
        transition
        cursor-pointer
      "
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={partnerPhotoUrl || '/avatar.jpg'}
            alt="profile"
            className="w-12 h-12 rounded-xl object-cover shrink-0"
          />

          <div className="flex flex-col min-w-0">
            <span
              className={`
                text-sm truncate
                ${hasUnread ? 'text-white font-semibold' : 'text-white'}
              `}
            >
              {partnerDisplayName || partnerUsername || 'Vox'}
            </span>

            {showThreadPreview && (
              <span
                className={`
                  text-xs truncate mt-0.5
                  ${hasUnread ? 'text-white/80' : 'text-white/50'}
                `}
                title={preview || ''}
              >
                {preview || 'No Vox yet'}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {hasUnread && (
            <span
              className="
                min-w-[18px] h-[18px]
                px-1
                rounded-full
                bg-white
                text-black
                text-[10px]
                font-semibold
                flex items-center justify-center
              "
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(conversationId)
              }}
              className="
                p-2
                rounded-lg
                text-white/40
                hover:text-white
                hover:bg-white/10
                transition
              "
              aria-label="Delete Vox"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
