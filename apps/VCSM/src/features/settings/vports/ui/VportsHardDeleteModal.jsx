import { Trash2, X } from 'lucide-react'

export function VportsHardDeleteModal({ target, onClose, onConfirm, busy, error, confirmText, onConfirmTextChange }) {
  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full items-center justify-center p-4">
        <div className="settings-shell relative w-full max-w-[420px] overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-rose-400" />
              <div className="text-sm font-semibold text-rose-200">Permanently delete VPORT</div>
            </div>
            <button onClick={onClose} className="settings-btn settings-btn--ghost p-1.5 text-white/70">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <img
                src={target.avatar_url || '/avatar.jpg'}
                alt=""
                className="h-12 w-12 shrink-0 rounded-lg border border-white/10 object-cover"
                style={{ filter: 'grayscale(0.7) opacity(0.6)' }}
                onError={e => { e.currentTarget.src = '/avatar.jpg' }}
              />
              <div>
                <div className="text-sm font-semibold text-white">{target.name}</div>
                {target.slug && <div className="text-xs text-white/40">@{target.slug}</div>}
              </div>
            </div>

            <p className="mb-4 text-sm text-white/70">
              This action is <span className="font-semibold text-rose-300">permanent and cannot be undone.</span> The VPORT, its services, bookings, and all associated data will be deleted forever.
            </p>

            <label className="mb-1.5 block text-xs font-medium text-white/50">
              Type <span className="font-semibold text-white/80">{target.name}</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => onConfirmTextChange(e.target.value)}
              placeholder={target.name}
              className="settings-input w-full rounded-lg px-3 py-2 text-sm"
              autoComplete="off"
            />

            {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
          </div>

          <div className="flex gap-2 border-t border-white/8 px-4 py-3">
            <button onClick={onClose} className="settings-btn settings-btn--ghost flex-1 py-2 text-sm">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={busy || confirmText !== target.name}
              className="settings-btn settings-btn--danger flex-1 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? 'Deleting…' : 'Delete permanently'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
