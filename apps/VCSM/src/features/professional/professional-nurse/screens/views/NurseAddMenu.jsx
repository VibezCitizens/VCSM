import { useEffect, useRef } from 'react'

export default function NurseAddMenu({
  open = false,
  anchorRect = null,
  onClose,
  onHousing,
  onFacility,
}) {
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return

    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.()
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

  const gap = 6
  const menuWidth = 220
  const menuHeight = 88
  const viewportHeight = window.innerHeight
  const spaceBelow = viewportHeight - anchorRect.bottom
  const openUpward = spaceBelow < menuHeight + gap
  const top = openUpward
    ? Math.max(8, anchorRect.top - menuHeight - gap)
    : anchorRect.bottom + gap
  const left = Math.max(8, anchorRect.right - menuWidth)

  return (
    <div className="fixed inset-0 z-[9999]" aria-hidden={!open}>
      <div
        ref={ref}
        className="absolute min-w-[220px] overflow-hidden rounded-xl border border-white/10 bg-neutral-800/95 text-white shadow-2xl"
        style={{
          top,
          left,
          transformOrigin: openUpward ? 'bottom' : 'top',
        }}
      >
        <ul className="m-0 list-none p-0 py-1">
          <li>
            <button
              type="button"
              className="w-full px-4 py-2 text-left text-white hover:bg-white/10"
              onClick={() => {
                onHousing?.()
                onClose?.()
              }}
            >
              Add housing note
            </button>
          </li>
          <li>
            <button
              type="button"
              className="w-full px-4 py-2 text-left text-white hover:bg-white/10"
              onClick={() => {
                onFacility?.()
                onClose?.()
              }}
            >
              Add hospital note
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}
