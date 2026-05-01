import { X } from 'lucide-react'

export function VportsUnpublishModal({ target, onClose, onConfirm, busyId, error }) {
  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full items-center justify-center p-4">
        <div className="settings-shell relative w-full max-w-[400px] overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <div className="text-sm font-semibold text-white">Unpublish business card?</div>
            <button onClick={onClose} className="settings-btn settings-btn--ghost p-1.5 text-white/70">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5">
            <p className="text-sm text-white/70">
              The public link for <span className="font-medium text-white">{target.name}</span> will stop working immediately. Leads collected so far are kept.
            </p>
            {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
          </div>

          <div className="flex gap-2 border-t border-white/8 px-4 py-3">
            <button onClick={onClose} className="settings-btn settings-btn--ghost flex-1 py-2 text-sm">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={busyId === target.id}
              className="settings-btn flex-1 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: 'rgba(217,119,6,0.8)', color: '#fff' }}
            >
              {busyId === target.id ? 'Unpublishing…' : 'Unpublish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
