// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\WandersMailboxItemRow.jsx
// ============================================================================
// WANDERS COMPONENT — MAILBOX ITEM ROW
// UI-only row renderer for mailbox item.
// No DAL, no controllers, no domain rules.
// ============================================================================

import React, { useMemo } from 'react'

/**
 * @param {{
 *   item: any,
 *   onClick?: (item: any) => void,
 *   isSelected?: boolean,
 *   className?: string,
 * }} props
 */
export function WandersMailboxItemRow({
  item,
  onClick,
  isSelected = false,
  className = '',
}) {
  const view = useMemo(() => {
    const card = item?.card ?? {}

    const templateKey = card?.templateKey ?? 'classic'
    const messageText = card?.messageText ?? ''
    const customization = card?.customization ?? {}

    const toName =
      customization?.toName ??
      customization?.to_name ??
      null

    const fromName =
      customization?.fromName ??
      customization?.from_name ??
      null

    const isAnonymous = card?.isAnonymous ?? false

    const displayFrom = isAnonymous
      ? 'Secret admirer 💌'
      : (fromName || 'Someone 💌')

    const previewMessage = (messageText || '').trim()

    return {
      templateKey,
      toName,
      displayFrom,
      previewMessage,
      isRead: item?.isRead ?? false,
      pinned: item?.pinned ?? false,
      folder: item?.folder ?? 'inbox',
      createdAt: item?.createdAt ?? item?.created_at ?? null,
    }
  }, [item])

  const handleClick = () => {
    if (typeof onClick === 'function') {
      onClick(item)
    }
  }

  const dateLabel = useMemo(() => {
    if (!view.createdAt) return ''
    try {
      const d = new Date(view.createdAt)
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return ''
    }
  }, [view.createdAt])

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        'w-full text-left transition',
        'px-4 py-3',
        isSelected ? 'bg-pink-50' : 'hover:bg-gray-50',
        className,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        {/* LEFT */}
        <div className="min-w-0 flex-1">
          {/* Top line */}
          <div className="flex items-center gap-2">
            {!view.isRead && (
              <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-pink-500" />
            )}

            <div className="truncate text-sm font-semibold text-gray-900">
              {view.displayFrom}
            </div>

            {view.pinned && (
              <span className="text-xs opacity-60">📌</span>
            )}
          </div>

          {/* Message preview */}
          <div className="mt-1 truncate text-sm text-gray-600">
            {view.previewMessage || 'No message'}
          </div>
        </div>

        {/* RIGHT */}
        <div className="shrink-0 text-xs text-gray-400">
          {dateLabel}
        </div>
      </div>
    </button>
  )
}

export default WandersMailboxItemRow
