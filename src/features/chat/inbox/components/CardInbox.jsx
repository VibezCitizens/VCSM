import React from 'react'
import { Trash2 } from 'lucide-react'

export default function CardInbox({ entry, onClick, onDelete, showThreadPreview = true }) {
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
      className="module-modern-card cursor-pointer rounded-2xl transition hover:bg-slate-800/55"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={partnerPhotoUrl || '/avatar.jpg'}
            alt="profile"
            className="h-12 w-12 shrink-0 rounded-xl border border-slate-300/15 object-cover"
          />

          <div className="flex min-w-0 flex-col">
            <span className={`truncate text-sm ${hasUnread ? 'font-semibold text-slate-100' : 'text-slate-200'}`}>
              {partnerDisplayName || partnerUsername || 'Vox'}
            </span>

            {showThreadPreview && (
              <span className={`mt-0.5 truncate text-xs ${hasUnread ? 'text-slate-300' : 'text-slate-500'}`} title={preview || ''}>
                {preview || 'No Vox yet'}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {hasUnread && (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(conversationId)
              }}
              className="module-modern-btn module-modern-btn--ghost p-2 text-slate-300"
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
