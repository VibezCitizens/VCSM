import { Check, Copy, ExternalLink, QrCode as QrIcon, X } from 'lucide-react'
import { QrCode } from '@/features/dashboard/qrcode/adapters/qrcode.adapter'
import { buildBusinessCardQrUrl } from '@/shared/lib/qrUrlBuilders'

export function VportsQrModal({ target, onClose, qrCopied, setQrCopied }) {
  // Centralized URL — no hardcoded domains. Uses window.location.origin for env parity.
  const cardUrl = buildBusinessCardQrUrl(target?.slug ?? '')

  function handleCopyLink() {
    if (!target?.slug) return
    navigator.clipboard?.writeText(cardUrl).then(() => {
      setQrCopied(true)
      setTimeout(() => setQrCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-[360px] overflow-hidden rounded-2xl"
          style={{ background: 'linear-gradient(160deg, rgba(22,18,42,0.99) 0%, rgba(12,10,22,0.99) 100%)', border: '1px solid rgba(124,92,255,0.22)', boxShadow: '0 24px 64px rgba(0,0,0,0.72), 0 0 0 1px rgba(124,92,255,0.08) inset' }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2">
              <QrIcon className="h-4 w-4" style={{ color: '#a78bfa' }} />
              <span className="text-sm font-semibold text-white">Business Card QR</span>
            </div>
            <button onClick={onClose} aria-label="Close QR modal" className="settings-btn settings-btn--ghost p-1.5 text-white/50">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 px-4 pt-4 pb-0">
            <img
              src={target.avatar_url || '/avatar.jpg'}
              alt=""
              className="h-10 w-10 shrink-0 rounded-lg border border-white/10 object-cover"
              onError={e => { e.currentTarget.src = '/avatar.jpg' }}
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{target.name}</div>
              <div className="truncate text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>@{target.slug}</div>
            </div>
          </div>

          <div className="flex justify-center px-4 py-5">
            <div
              role="img"
              aria-label={`Business card QR code for ${target.name ?? target.slug}`}
              className="rounded-xl p-3"
              style={{ background: '#ffffff', boxShadow: '0 0 0 1px rgba(124,92,255,0.18), 0 8px 24px rgba(0,0,0,0.32)' }}
            >
              <QrCode
                value={cardUrl}
                size={240}
                bgColor="#ffffff"
                fgColor="#0a0a0f"
                level="M"
              />
            </div>
          </div>

          <div
            className="mx-4 mb-4 overflow-hidden rounded-lg px-3 py-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span
              className="block w-full truncate text-center text-xs"
              style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'monospace' }}
            >
              {cardUrl}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 px-4 pb-4">
            <button
              onClick={handleCopyLink}
              aria-label={qrCopied ? 'Link copied' : 'Copy business card link'}
              className="settings-btn settings-btn--ghost inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs"
            >
              {qrCopied ? <Check className="h-3.5 w-3.5" style={{ color: '#6ee7b7' }} /> : <Copy className="h-3.5 w-3.5" />}
              <span>{qrCopied ? 'Copied!' : 'Copy link'}</span>
            </button>

            <button
              onClick={() => window.open(cardUrl, '_blank')}
              aria-label="Open business card in new tab"
              className="settings-btn settings-btn--ghost inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open card</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
