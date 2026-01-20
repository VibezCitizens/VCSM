/**
 * ============================================================
 * NurseAddMenu
 * ------------------------------------------------------------
 * Bubble-anchored "+" menu (Chat-style, matched 1:1)
 *
 * RULES:
 * - UI-only
 * - Uses anchorRect ONLY
 * - Auto-flips up near bottom
 * - No list bullets
 * - Inline emoji text
 * ============================================================
 */

import { useEffect, useRef } from 'react'

export default function NurseAddMenu({
  open = false,
  anchorRect = null,
  onClose,
  onHousing,
  onFacility,
  onFood,
}) {
  const ref = useRef(null)

  /* ============================================================
     Close handlers (IDENTICAL)
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
     Positioning (AUTO FLIP — IDENTICAL)
     ============================================================ */
  const GAP = 6
  const MENU_WIDTH = 220
  const MENU_HEIGHT = 120

  const viewportHeight = window.innerHeight
  const spaceBelow = viewportHeight - anchorRect.bottom

  const openUpward = spaceBelow < MENU_HEIGHT + GAP

  const top = openUpward
    ? Math.max(8, anchorRect.top - MENU_HEIGHT - GAP)
    : anchorRect.bottom + GAP

  const left = Math.max(8, anchorRect.right - MENU_WIDTH)

  return (
    <div className="fixed inset-0 z-[9999]" aria-hidden={!open}>
      <div
        ref={ref}
        className="
          absolute
          min-w-[220px]
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
          <li>
            <button
              className="
                w-full text-left px-4 py-2
                text-white
                hover:bg-white/10
              "
              onClick={() => {
                onHousing?.()
                onClose?.()
              }}
            >
              🏠 Add housing experience
            </button>
          </li>

          <li>
            <button
              className="
                w-full text-left px-4 py-2
                text-white
                hover:bg-white/10
              "
              onClick={() => {
                onFacility?.()
                onClose?.()
              }}
            >
              🏥 Add facility insight
            </button>
          </li>

          <li>
            <button
              className="
                w-full text-left px-4 py-2
                text-white
                hover:bg-white/10
              "
              onClick={() => {
                onFood?.()
                onClose?.()
              }}
            >
              🍽️ Add food / city note
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}
