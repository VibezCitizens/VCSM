import { useEffect } from 'react'

export default function FeedConfirmModal({
  open = false,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCancel?.()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  const confirmButtonClass =
    tone === 'danger'
      ? 'border-rose-300/30 bg-rose-500/20 text-rose-100 hover:bg-rose-500/30'
      : 'border-sky-300/30 bg-sky-500/20 text-sky-100 hover:bg-sky-500/30'

  return (
    <div
      className="fixed inset-0 z-[1000000] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel?.()
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-sky-300/20 bg-[linear-gradient(180deg,rgba(16,24,46,0.98),rgba(8,12,24,0.96))] shadow-[0_24px_42px_rgba(0,0,0,0.45),0_0_22px_rgba(99,137,255,0.25)]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
        </div>

        <div className="px-5 py-4 text-sm text-slate-300">{message}</div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${confirmButtonClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
