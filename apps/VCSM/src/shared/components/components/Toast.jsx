// src/shared/components/components/Toast.jsx

import { useEffect } from 'react'
import clsx from 'clsx'

export default function Toast({
  open = false,
  message = '',
  duration = 1400,
  onClose,
}) {
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      onClose?.()
    }, duration)
    return () => clearTimeout(t)
  }, [open, duration, onClose])

  if (!open || !message) return null

  return (
    <div
      className="
        fixed inset-0 z-[99999]
        pointer-events-none
        flex items-end justify-center
        pb-24
      "
      aria-live="polite"
    >
      <div
        className={clsx(
          'px-4 py-2 rounded-full',
          'text-sm font-medium',
          'bg-black/80 text-white',
          'backdrop-blur',
          'shadow-xl'
        )}
      >
        {message}
      </div>
    </div>
  )
}
