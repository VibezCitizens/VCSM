import { Check, Copy, ExternalLink, QrCode as QrIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '@/features/settings/ui/Card'

function handleCopyLink(v, setCopiedId) {
  const url = `https://vibezcitizens.com/vport/${v.slug}/card`
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(v.id)
      setTimeout(() => setCopiedId(id => id === v.id ? null : id), 2000)
    }).catch(() => {})
  }
}

export function VportsBusinessCardSection({
  items,
  activeActor,
  resolveVportActorId,
  busyCardPublishId,
  errCardPublish,
  errCardPublishId,
  setBusinessCardPublished,
  copiedId,
  setCopiedId,
  setUnpublishTarget,
  setQrTarget,
  setQrCopied,
}) {
  const navigate = useNavigate()

  if (activeActor === 'profile') return null

  const activeVportCards = items.filter(v => v.slug && activeActor === `vport:${resolveVportActorId(v)}`)
  if (activeVportCards.length === 0) return null

  return (
    <Card>
      <div className="mb-3 text-sm font-semibold text-white">Business Cards</div>
      <div className="space-y-3">
        {activeVportCards.map(v => {
          const isDisabled = v.is_deleted || !v.is_active
          const isBusy = busyCardPublishId === v.id
          const isPublished = !!v.business_card_published
          const cardUrl = `https://vibezcitizens.com/vport/${v.slug}/card`
          const isCopied = copiedId === v.id

          return (
            <div
              key={v.id}
              className="rounded-xl p-3"
              style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.18)' }}
            >
              <div className="mb-2.5 flex items-center gap-2.5">
                <img
                  src={v.avatar_url || '/avatar.jpg'}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-lg border border-white/10 object-cover"
                  style={isDisabled ? { filter: 'grayscale(0.5) opacity(0.6)' } : {}}
                  onError={e => { e.currentTarget.src = '/avatar.jpg' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white/90">{v.name}</div>
                  <div className="truncate text-xs text-white/35">@{v.slug}</div>
                </div>
                <span
                  className="settings-status-badge shrink-0"
                  style={isPublished && !isDisabled
                    ? { border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.1)', color: '#6ee7b7' }
                    : { border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }
                  }
                >
                  {isPublished && !isDisabled ? 'Published' : 'Unpublished'}
                </span>
              </div>

              {isDisabled ? (
                <p className="mb-2.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {v.is_deleted
                    ? 'Restore this VPORT before publishing its business card.'
                    : 'This VPORT is inactive.'}
                </p>
              ) : (
                <div className="mb-2.5 flex items-center gap-1.5 overflow-hidden rounded-lg px-2.5 py-1.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="min-w-0 flex-1 truncate text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                    {cardUrl}
                  </span>
                </div>
              )}

              {errCardPublish && errCardPublishId === v.id && (
                <p className="mb-2 text-xs text-rose-400">{errCardPublish}</p>
              )}

              <div className="flex flex-wrap gap-1.5">
                {isPublished ? (
                  <button
                    onClick={() => setUnpublishTarget(v)}
                    disabled={isBusy || isDisabled}
                    className="settings-btn settings-btn--ghost px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ color: '#fcd34d', borderColor: 'rgba(217,119,6,0.35)' }}
                  >
                    {isBusy ? 'Updating…' : 'Unpublish'}
                  </button>
                ) : (
                  <button
                    onClick={() => setBusinessCardPublished(v.id, true)}
                    disabled={isBusy || isDisabled}
                    className="settings-btn px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: 'var(--vc-accent)', color: '#fff' }}
                  >
                    {isBusy ? 'Publishing…' : 'Publish card'}
                  </button>
                )}

                <button
                  onClick={() => handleCopyLink(v, setCopiedId)}
                  disabled={!isPublished || isDisabled}
                  className="settings-btn settings-btn--ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {isCopied ? 'Copied' : 'Copy link'}
                </button>

                <button
                  onClick={() => { setQrTarget(v); setQrCopied(false) }}
                  disabled={!isPublished || isDisabled}
                  className="settings-btn settings-btn--ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <QrIcon className="h-3 w-3" />
                  Quick QR
                </button>

                <button
                  onClick={() => navigate(`/vport/${v.slug}/card`, { state: { fromSettings: true } })}
                  disabled={!isPublished || isDisabled}
                  className="settings-btn settings-btn--ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ExternalLink className="h-3 w-3" />
                  Preview
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
