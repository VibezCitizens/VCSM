import { useState } from 'react'
import { AlertTriangle, Check, Copy, ExternalLink, Plus, RotateCcw, Trash2, X } from 'lucide-react'

import Card from '@/features/settings/ui/Card'
import CreateVportForm from '@/features/vport/adapters/CreateVportForm.jsx.adapter'
import OnemoredaysAd from '@/features/ads/adapters/widgets/OnemoredaysAd.adapter'

import { useVportsController } from '@/features/settings/vports/hooks/useVportsController'

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
  } = useVportsController()

  const [hardDeleteConfirmText, setHardDeleteConfirmText] = useState('')

  const activeVports = items.filter(v => !v.is_deleted)
  const deactivatedVports = items.filter(v => v.is_deleted)

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
              const isActive = activeActor === `vport:${resolveVportActorId(v)}`
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

      <OnemoredaysAd />

      {/* ── Create VPORT modal ─────────────────────────── */}
      {showCreator && (
        <div className="fixed inset-0 z-[120]">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowCreator(false)} />
          <div className="relative z-10 flex h-full w-full items-start justify-center overflow-y-auto p-3 sm:items-center sm:p-4">
            <div className="settings-shell relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl sm:max-h-[calc(100dvh-2rem)]">
              <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-4 py-3">
                <div className="text-sm font-semibold text-white">Create a VPORT</div>
                <button onClick={() => setShowCreator(false)} className="settings-btn settings-btn--ghost p-1.5 text-white/70">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 overflow-y-auto overscroll-contain p-4 touch-pan-y">
                <CreateVportForm
                  onCreated={(payload) => {
                    onVportCreated(payload)
                    setShowCreator(false)
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Recover (restore) modal ────────────────────── */}
      {restoreTarget && (
        <div className="fixed inset-0 z-[120]">
          <div className="absolute inset-0 bg-black/70" onClick={() => setRestoreTarget(null)} />
          <div className="relative z-10 flex h-full w-full items-center justify-center p-4">
            <div className="settings-shell relative w-full max-w-[420px] overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                <div className="text-sm font-semibold text-white">Recover VPORT</div>
                <button onClick={() => setRestoreTarget(null)} className="settings-btn settings-btn--ghost p-1.5 text-white/70">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5">
                <div className="mb-4 flex items-center gap-3">
                  <img
                    src={restoreTarget.avatar_url || '/avatar.jpg'}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-lg border border-white/10 object-cover"
                    onError={e => { e.currentTarget.src = '/avatar.jpg' }}
                  />
                  <div>
                    <div className="text-sm font-semibold text-white">{restoreTarget.name}</div>
                    {restoreTarget.slug && <div className="text-xs text-white/40">@{restoreTarget.slug}</div>}
                  </div>
                </div>

                <p className="mb-1 text-sm text-white/70">
                  Recovering this VPORT will make it <span className="font-medium text-white">fully visible</span> to the public again. Its profile, services, and content will be restored.
                </p>

                {errRestore && <p className="mt-3 text-xs text-rose-400">{errRestore}</p>}
              </div>

              <div className="flex gap-2 border-t border-white/8 px-4 py-3">
                <button onClick={() => setRestoreTarget(null)} className="settings-btn settings-btn--ghost flex-1 py-2 text-sm">
                  Cancel
                </button>
                <button
                  onClick={handleRecoverConfirm}
                  disabled={busyRestore}
                  className="settings-btn flex-1 py-2 text-sm font-medium"
                  style={{ background: 'var(--vc-accent)', color: '#fff' }}
                >
                  {busyRestore ? 'Recovering…' : 'Recover VPORT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete permanently modal ───────────────────── */}
      {hardDeleteTarget && (
        <div className="fixed inset-0 z-[120]">
          <div className="absolute inset-0 bg-black/70" onClick={() => { setHardDeleteTarget(null); setHardDeleteConfirmText('') }} />
          <div className="relative z-10 flex h-full w-full items-center justify-center p-4">
            <div className="settings-shell relative w-full max-w-[420px] overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-rose-400" />
                  <div className="text-sm font-semibold text-rose-200">Permanently delete VPORT</div>
                </div>
                <button
                  onClick={() => { setHardDeleteTarget(null); setHardDeleteConfirmText('') }}
                  className="settings-btn settings-btn--ghost p-1.5 text-white/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5">
                <div className="mb-4 flex items-center gap-3">
                  <img
                    src={hardDeleteTarget.avatar_url || '/avatar.jpg'}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-lg border border-white/10 object-cover"
                    style={{ filter: 'grayscale(0.7) opacity(0.6)' }}
                    onError={e => { e.currentTarget.src = '/avatar.jpg' }}
                  />
                  <div>
                    <div className="text-sm font-semibold text-white">{hardDeleteTarget.name}</div>
                    {hardDeleteTarget.slug && <div className="text-xs text-white/40">@{hardDeleteTarget.slug}</div>}
                  </div>
                </div>

                <p className="mb-4 text-sm text-white/70">
                  This action is <span className="font-semibold text-rose-300">permanent and cannot be undone.</span> The VPORT, its services, bookings, and all associated data will be deleted forever.
                </p>

                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Type <span className="font-semibold text-white/80">{hardDeleteTarget.name}</span> to confirm
                </label>
                <input
                  type="text"
                  value={hardDeleteConfirmText}
                  onChange={e => setHardDeleteConfirmText(e.target.value)}
                  placeholder={hardDeleteTarget.name}
                  className="settings-input w-full rounded-lg px-3 py-2 text-sm"
                  autoComplete="off"
                />

                {errHardDelete && <p className="mt-3 text-xs text-rose-400">{errHardDelete}</p>}
              </div>

              <div className="flex gap-2 border-t border-white/8 px-4 py-3">
                <button
                  onClick={() => { setHardDeleteTarget(null); setHardDeleteConfirmText('') }}
                  className="settings-btn settings-btn--ghost flex-1 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleHardDeleteConfirm}
                  disabled={busyHardDelete || hardDeleteConfirmText !== hardDeleteTarget.name}
                  className="settings-btn settings-btn--danger flex-1 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busyHardDelete ? 'Deleting…' : 'Delete permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
