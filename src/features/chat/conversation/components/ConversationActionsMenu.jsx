// src/features/chat/conversation/components/ConversationActionsMenu.jsx
import { useEffect, useRef } from 'react'

export default function ConversationActionsMenu({
  open = false,
  anchorRect = null,
  onClose,
  onArchiveConversation,
  onUnarchiveConversation, // ✅ NEW
  onReportConversation,
  onMarkSpam,
  onBlockUser,
  onClearChat,
}) {
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return

    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose?.()
      }
    }

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose?.()
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)

    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open, onClose])

  if (!open || !anchorRect) return null

  const GAP = 8
  const MENU_WIDTH = 200

  const items = [
    // ✅ NEW: Unarchive item
    typeof onUnarchiveConversation === 'function'
      ? {
          key: 'unarchive',
          label: '📤 Unarchive Vox',
          tone: 'text-white',
          fn: onUnarchiveConversation,
        }
      : null,

    typeof onArchiveConversation === 'function'
      ? {
          key: 'archive',
          label: '🗃️ Archive Vox',
          tone: 'text-white',
          fn: onArchiveConversation,
        }
      : null,

    typeof onReportConversation === 'function'
      ? {
          key: 'report',
          label: '🚩 Report Vox',
          tone: 'text-red-400',
          fn: onReportConversation,
        }
      : null,

    typeof onMarkSpam === 'function'
      ? {
          key: 'spam',
          label: '🚫 Mark Vox as spam',
          tone: 'text-red-400',
          fn: onMarkSpam,
        }
      : null,

    typeof onBlockUser === 'function'
      ? { key: 'block', label: '⛔ Block Citizen', tone: 'text-red-400', fn: onBlockUser }
      : null,

    typeof onClearChat === 'function'
      ? { key: 'clear', label: '🧹 Clear Vox', tone: 'text-white', fn: onClearChat }
      : null,
  ].filter(Boolean)

  const ITEM_HEIGHT = 40
  const MENU_HEIGHT = Math.max(48, items.length * ITEM_HEIGHT)

  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth

  const spaceBelow = viewportHeight - anchorRect.bottom
  const openUpward = spaceBelow < MENU_HEIGHT + GAP

  const top = openUpward
    ? Math.max(8, anchorRect.top - MENU_HEIGHT - GAP)
    : anchorRect.bottom + GAP

  const left = Math.min(
    Math.max(8, anchorRect.right - MENU_WIDTH),
    viewportWidth - MENU_WIDTH - 8
  )

  return (
    <div className="fixed inset-0 z-[999999]" aria-hidden={!open}>
      <div
        ref={ref}
        className="
          absolute
          min-w-[200px]
          rounded-xl
          bg-neutral-800/95
          text-white
          shadow-2xl
          border border-white/10
          overflow-hidden
        "
        style={{
          top,
          left,
          transformOrigin: openUpward ? 'bottom' : 'top',
        }}
      >
        <ul className="m-0 list-none py-1 pl-0 pr-0">
          {items.map((it) => (
            <li key={it.key}>
              <button
                className={`
                  w-full text-left px-4 py-2
                  hover:bg-white/10
                  ${it.tone}
                `}
                onClick={() => {
                  it.fn?.()
                  onClose?.()
                }}
              >
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
