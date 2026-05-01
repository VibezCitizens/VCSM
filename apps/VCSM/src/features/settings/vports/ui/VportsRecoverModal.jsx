import { X } from 'lucide-react'

export function VportsRecoverModal({ target, onClose, onConfirm, busy, error }) {
  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full items-center justify-center p-4">
        <div className="settings-shell relative w-full max-w-[420px] overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <div className="text-sm font-semibold text-white">Recover VPORT</div>
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
                onError={e => { e.currentTarget.src = '/avatar.jpg' }}
              />
              <div>
                <div className="text-sm font-semibold text-white">{target.name}</div>
                {target.slug && <div className="text-xs text-white/40">@{target.slug}</div>}
              </div>
            </div>

            <p className="mb-1 text-sm text-white/70">
              Recovering this VPORT will make it <span className="font-medium text-white">fully visible</span> to the public again. Its profile, services, and content will be restored.
            </p>

            {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
          </div>

          <div className="flex gap-2 border-t border-white/8 px-4 py-3">
            <button onClick={onClose} className="settings-btn settings-btn--ghost flex-1 py-2 text-sm">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className="settings-btn flex-1 py-2 text-sm font-medium"
              style={{ background: 'var(--vc-accent)', color: '#fff' }}
            >
              {busy ? 'Recovering…' : 'Recover VPORT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
