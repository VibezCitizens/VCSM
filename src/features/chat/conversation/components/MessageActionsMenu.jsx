// src/features/chat/conversation/components/MessageActionsMenu.jsx
// ============================================================
// MessageActionsMenu (Bubble-anchored, WhatsApp-style)
// ------------------------------------------------------------
// - Uses anchorRect ONLY
// - No flex spacing bugs
// - Inline emoji text
// - Color-safe (explicit per action)
// ============================================================

import { useEffect, useRef } from 'react'

export default function MessageActionsMenu({
  open = false,
  anchorRect = null,
  isOwn = false,
  onClose,
  onEdit,
  onDeleteForMe,
  onUnsend,
}) {
  const ref = useRef(null)

  /* ============================================================
     Close handlers
     ============================================================ */
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

  /* ============================================================
     Positioning
     ============================================================ */
  const GAP = 6
  const MENU_WIDTH = 160

  const top = anchorRect.bottom + GAP
  const left = isOwn
    ? Math.max(8, anchorRect.right - MENU_WIDTH)
    : Math.max(8, anchorRect.left)

  return (
    <div className="fixed inset-0 z-[9999]" aria-hidden={!open}>
      <div
        ref={ref}
        className="
          absolute
          min-w-[160px]
          rounded-xl
          bg-neutral-800/95
          text-white
          shadow-2xl
          border border-white/10
          overflow-hidden
        "
        style={{ top, left }}
      >
        {/* IMPORTANT: kill browser list padding */}
        <ul className="m-0 list-none py-1 pl-0 pr-0">
          {isOwn && (
            <li>
              <button
                className="
                  w-full text-left px-4 py-2
                  text-red-400
                  hover:bg-white/10
                "
                onClick={() => {
                  onUnsend?.()
                  onClose?.()
                }}
              >
                🚫 Unsend
              </button>
            </li>
          )}

          <li>
            <button
              className="
                w-full text-left px-4 py-2
                text-white
                hover:bg-white/10
              "
              onClick={() => {
                onDeleteForMe?.()
                onClose?.()
              }}
            >
              🗑️ Delete for me
            </button>
          </li>

          {isOwn && (
            <li>
              <button
                className="
                  w-full text-left px-4 py-2
                  text-white
                  hover:bg-white/10
                "
                onClick={() => {
                  onEdit?.()
                  onClose?.()
                }}
              >
                ✏️ Edit
              </button>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
