import { useState } from 'react'
import { AlertTriangle, Plus, RotateCcw, Trash2 } from 'lucide-react'

import Card from '@/features/settings/ui/Card'
import OnemoredaysAd from '@/features/ads/adapters/widgets/OnemoredaysAd.adapter'
import { useVportsController } from '@/features/settings/vports/hooks/useVportsController'
import { useVportNotificationBadges } from '@/features/settings/vports/hooks/useVportNotificationBadges'

import { VportsBusinessCardSection } from '@/features/settings/vports/ui/VportsBusinessCardSection'
import { VportsCreateModal } from '@/features/settings/vports/ui/VportsCreateModal'
import { VportsRecoverModal } from '@/features/settings/vports/ui/VportsRecoverModal'
import { VportsUnpublishModal } from '@/features/settings/vports/ui/VportsUnpublishModal'
import { VportsHardDeleteModal } from '@/features/settings/vports/ui/VportsHardDeleteModal'
import { VportsQrModal } from '@/features/settings/vports/ui/VportsQrModal'

export default function VportsTabView() {
  const {
    items,
    setItems,
    busy,
    setBusy,
    showCreator,
    setShowCreator,
    activeActor,
    profileActorId,
    switchToProfile,
    switchToVport,
    resolveVportActorId,
    onVportCreated,
    refreshAvailableActors,
    restoreTarget,
    setRestoreTarget,
    busyRestore,
    errRestore,
    restoreVport,
    hardDeleteTarget,
    setHardDeleteTarget,
    busyHardDelete,
    errHardDelete,
    hardDeleteVport,
    busyCardPublishId,
    errCardPublish,
    errCardPublishId,
    setBusinessCardPublished,
  } = useVportsController()

  const [hardDeleteConfirmText, setHardDeleteConfirmText] = useState('')
  const [unpublishTarget, setUnpublishTarget] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [qrTarget, setQrTarget] = useState(null)
  const [qrCopied, setQrCopied] = useState(false)

  const activeVports = items.filter(v => !v.is_deleted)
  const deactivatedVports = items.filter(v => v.is_deleted)

  const getVportCount = useVportNotificationBadges(activeVports)

  async function handleRecoverConfirm() {
    const ok = await restoreVport(restoreTarget.id)
    if (ok) {
      setItems(prev => prev.map(v => v.id === restoreTarget.id ? { ...v, is_deleted: false } : v))
      refreshAvailableActors()
      setRestoreTarget(null)
    }
  }

  async function handleHardDeleteConfirm() {
    const ok = await hardDeleteVport(hardDeleteTarget.id)
    if (ok) {
      setItems(prev => prev.filter(v => v.id !== hardDeleteTarget.id))
      refreshAvailableActors()
      setHardDeleteTarget(null)
      setHardDeleteConfirmText('')
    }
  }

  async function handleUnpublishConfirm() {
    const ok = await setBusinessCardPublished(unpublishTarget.id, false)
    if (ok) setUnpublishTarget(null)
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="mb-3 text-sm font-semibold text-white">Your Profile</div>
        <button
          onClick={() => switchToProfile(profileActorId, setBusy)}
          disabled={busy || activeActor === 'profile'}
          className={[
            'settings-vport-row w-full px-4 py-3 text-left',
            'flex items-center justify-between rounded-xl',
            activeActor === 'profile' ? 'is-active' : '',
            busy ? 'cursor-wait opacity-60' : '',
          ].join(' ')}
        >
          <span className="font-medium text-white">
            {activeActor === 'profile' ? 'Current Profile' : 'Switch to My Profile'}
          </span>
          <span className="settings-vport-tag px-2 py-0.5 text-[10px] uppercase">Profile</span>
        </button>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Your VPORTs</div>
          <button onClick={() => setShowCreator(true)} className="settings-btn settings-btn--ghost inline-flex items-center gap-2 px-3 py-1.5 text-xs">
            <Plus className="h-4 w-4" />
            Create VPORT
          </button>
        </div>

        {!activeVports.length ? (
          <div className="settings-card-surface rounded-xl px-4 py-3 text-sm text-white/50">
            {deactivatedVports.length > 0 ? 'No active VPORTs. See deactivated VPORTs below.' : 'You do not own any VPORTs yet.'}
          </div>
        ) : (
          <ul className="m-0 grid list-none grid-cols-1 gap-2.5 p-0">
            {activeVports.map((v) => {
              const vportActorId = resolveVportActorId(v)
              const isActive = activeActor === `vport:${vportActorId}`
              const unreadCount = getVportCount(vportActorId)
              return (
                <li
                  key={v.id}
                  className={[
                    'settings-vport-row flex w-full items-center justify-between rounded-xl px-3 py-2.5',
                    isActive ? 'is-active' : '',
                  ].join(' ')}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={v.avatar_url || '/avatar.jpg'}
                      alt=""
                      className="h-10 w-10 rounded-lg border border-white/12 object-cover"
                      onError={e => { e.currentTarget.src = '/avatar.jpg' }}
                    />
                    <div className="min-w-0 text-[1rem] font-medium text-white truncate">{v.name}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {unreadCount > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-purple-500/90 px-1.5 text-[11px] font-bold leading-none text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                    <button
                      onClick={() => switchToVport(v, setBusy)}
                      disabled={busy || isActive}
                      className={[
                        'settings-btn settings-btn--ghost border px-3 py-1.5 text-xs',
                        isActive ? 'opacity-90' : '',
                      ].join(' ')}
                    >
                      {isActive ? 'Current' : 'Switch'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {deactivatedVports.length > 0 && (
        <div
          className="overflow-hidden rounded-2xl"
          style={{ border: '1px solid rgba(217,119,6,0.25)', background: 'linear-gradient(120deg, rgba(120,53,15,0.18), rgba(88,28,135,0.08)), var(--vc-surface)' }}
        >
          <div className="flex items-center gap-2 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(217,119,6,0.15)' }}>
            <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: '#fbbf24' }} />
            <span className="text-sm font-semibold" style={{ color: '#fcd34d' }}>Deactivated VPORTs</span>
          </div>
          <div className="space-y-2 p-3">
            {deactivatedVports.map(v => (
              <div
                key={v.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(0,0,0,0.2)' }}
              >
                <img
                  src={v.avatar_url || '/avatar.jpg'}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-lg border border-white/10 object-cover"
                  style={{ filter: 'grayscale(0.6) opacity(0.65)' }}
                  onError={e => { e.currentTarget.src = '/avatar.jpg' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white/60">{v.name}</div>
                  {v.slug ? <div className="truncate text-xs text-white/35">@{v.slug}</div> : null}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => setRestoreTarget(v)}
                    className="settings-btn settings-btn--ghost shrink-0 px-2.5 py-1.5 text-xs"
                    style={{ color: '#fcd34d', borderColor: 'rgba(217,119,6,0.35)' }}
                  >
                    <RotateCcw className="mr-1 inline h-3 w-3" />
                    Recover
                  </button>
                  <button
                    onClick={() => { setHardDeleteConfirmText(''); setHardDeleteTarget(v) }}
                    className="settings-btn settings-btn--danger shrink-0 px-2.5 py-1.5 text-xs"
                  >
                    <Trash2 className="mr-1 inline h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <VportsBusinessCardSection
        items={items}
        activeActor={activeActor}
        resolveVportActorId={resolveVportActorId}
        busyCardPublishId={busyCardPublishId}
        errCardPublish={errCardPublish}
        errCardPublishId={errCardPublishId}
        setBusinessCardPublished={setBusinessCardPublished}
        copiedId={copiedId}
        setCopiedId={setCopiedId}
        setUnpublishTarget={setUnpublishTarget}
        setQrTarget={setQrTarget}
        setQrCopied={setQrCopied}
      />

      <OnemoredaysAd />

      {showCreator && (
        <VportsCreateModal
          onClose={() => setShowCreator(false)}
          onCreated={(payload) => { onVportCreated(payload); setShowCreator(false) }}
        />
      )}

      {restoreTarget && (
        <VportsRecoverModal
          target={restoreTarget}
          onClose={() => setRestoreTarget(null)}
          onConfirm={handleRecoverConfirm}
          busy={busyRestore}
          error={errRestore}
        />
      )}

      {unpublishTarget && (
        <VportsUnpublishModal
          target={unpublishTarget}
          onClose={() => setUnpublishTarget(null)}
          onConfirm={handleUnpublishConfirm}
          busyId={busyCardPublishId}
          error={errCardPublish}
        />
      )}

      {hardDeleteTarget && (
        <VportsHardDeleteModal
          target={hardDeleteTarget}
          onClose={() => { setHardDeleteTarget(null); setHardDeleteConfirmText('') }}
          onConfirm={handleHardDeleteConfirm}
          busy={busyHardDelete}
          error={errHardDelete}
          confirmText={hardDeleteConfirmText}
          onConfirmTextChange={setHardDeleteConfirmText}
        />
      )}

      {qrTarget && (
        <VportsQrModal
          target={qrTarget}
          onClose={() => setQrTarget(null)}
          qrCopied={qrCopied}
          setQrCopied={setQrCopied}
        />
      )}
    </div>
  )
}
