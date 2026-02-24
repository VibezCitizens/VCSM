// src/features/post/postcard/components/PostActionsMenu.jsx

import { useEffect, useRef } from 'react'

export default function PostActionsMenu({
  open = false,
  anchorRect = null,
  isOwn = false,
  onClose,

  onEdit,
  onDelete,

  onReport,
}) {
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return

    const handleClick = (e) => {
      const menuEl = ref.current
      const inside = !!(menuEl && menuEl.contains(e.target))

      if (menuEl && !inside) {
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

  const items = [
    isOwn && typeof onEdit === 'function'
      ? { key: 'edit', label: 'Edit', tone: 'text-white', fn: onEdit }
      : null,

    isOwn && typeof onDelete === 'function'
      ? { key: 'delete', label: 'Delete', tone: 'text-red-400', fn: onDelete }
      : null,

    // Only show report when NOT owner
    !isOwn && typeof onReport === 'function'
      ? { key: 'report', label: 'Report', tone: 'text-red-400', fn: onReport }
      : null,
  ].filter(Boolean)

  if (items.length === 0) return null

  const GAP = 8
  const MENU_WIDTH = 200
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
        style={{ top, left, transformOrigin: openUpward ? 'bottom' : 'top' }}
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
                }}
                type="button"
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
