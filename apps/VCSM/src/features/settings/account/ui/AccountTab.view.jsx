import { useState } from 'react'
import { useVportsList } from '@/features/settings/vports/hooks/useVportsList'
import { useAccountController } from '@/features/settings/account/hooks/useAccountController'
import { VportDangerRow, SoftDeleteModal, HardDeleteModal, RestoreModal, DeleteModal, DangerLabel, Chevron } from '@/features/settings/account/ui/components/AccountTabSubComponents'

export default function AccountTabView() {
  const { items: vports, setItems: setVports } = useVportsList()
  const {
    isVport,
    vportId,
    identity,
    user,
    showConfirmAccount,
    busyAccount,
    errAccount,
    busySoft,
    errSoft,
    busyHard,
    errHard,
    busyRestore,
    errRestore,
    setShowConfirmAccount,
    logout,
    deleteAccount,
    softDeleteVport,
    hardDeleteVport,
    restoreVport,
  } = useAccountController()

  const [dangerOpen, setDangerOpen] = useState(false)
  const [softTarget, setSoftTarget] = useState(null)
  const [hardTarget, setHardTarget] = useState(null)
  const [restoreTarget, setRestoreTarget] = useState(null)

  const citizenName = identity?.displayName ?? 'Your account'
  const citizenAvatar = identity?.photoUrl || '/avatar.jpg'

  async function handleSoftConfirm() {
    const ok = await softDeleteVport(softTarget.id)
    if (ok) {
      setVports(prev => prev.map(v => v.id === softTarget.id ? { ...v, is_deleted: true } : v))
      setSoftTarget(null)
    }
  }

  async function handleHardConfirm() {
    await hardDeleteVport(hardTarget.id)
    // navigation happens inside hardDeleteVport on success
  }

  async function handleRestoreConfirm() {
    const ok = await restoreVport(restoreTarget.id)
    if (ok) {
      setVports(prev => prev.map(v => v.id === restoreTarget.id ? { ...v, is_deleted: false } : v))
      setRestoreTarget(null)
    }
  }

  // ── VPORT mode: only show the active VPORT ──────────────
  if (isVport) {
    const activeVport = vports.find(v => v.id === vportId) ?? null
    const displayName = identity?.displayName ?? activeVport?.name ?? 'VPORT'
    const avatarSrc = identity?.photoUrl || activeVport?.avatar_url || '/avatar.jpg'
    const slug = identity?.username ?? activeVport?.slug ?? ''

    return (
      <div className="space-y-5">

        {/* Active VPORT identity card */}
        <div className="settings-identity-card rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <img
              src={avatarSrc}
              alt={displayName}
              className="h-14 w-14 shrink-0 rounded-lg border border-white/12 object-cover"
              onError={e => { e.currentTarget.src = '/avatar.jpg' }}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold text-white">{displayName}</div>
              {slug ? <div className="truncate text-sm text-white/50">@{slug}</div> : null}
            </div>
            <button onClick={logout} className="settings-btn settings-btn--ghost shrink-0 px-3 py-1.5 text-sm">
              Sign out
            </button>
          </div>
        </div>

        {/* Danger zone — only this VPORT */}
        {activeVport && (
          <div className="settings-danger-zone">
            <button onClick={() => setDangerOpen(v => !v)} className="settings-danger-zone-header w-full">
              <DangerLabel />
              <Chevron open={dangerOpen} />
            </button>

            {dangerOpen && (
              <div className="settings-danger-zone-body space-y-2">
                <VportDangerRow
                  vport={activeVport}
                  onSoftDelete={() => setSoftTarget(activeVport)}
                  onHardDelete={() => setHardTarget(activeVport)}
                  onRestore={() => setRestoreTarget(activeVport)}
                />
                {(errSoft || errHard || errRestore) && (
                  <div className="settings-danger-error px-3 py-2 text-sm">{errSoft || errHard || errRestore}</div>
                )}
              </div>
            )}
          </div>
        )}

        {softTarget && (
          <SoftDeleteModal
            vport={softTarget}
            busy={busySoft}
            onCancel={() => !busySoft && setSoftTarget(null)}
            onConfirm={handleSoftConfirm}
          />
        )}

        {hardTarget && (
          <HardDeleteModal
            vport={hardTarget}
            busy={busyHard}
            onCancel={() => !busyHard && setHardTarget(null)}
            onConfirm={handleHardConfirm}
          />
        )}

        {restoreTarget && (
          <RestoreModal
            vport={restoreTarget}
            busy={busyRestore}
            onCancel={() => !busyRestore && setRestoreTarget(null)}
            onConfirm={handleRestoreConfirm}
          />
        )}
      </div>
    )
  }

  // ── Citizen mode ─────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Citizen identity card */}
      <div className="settings-identity-card rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <img
            src={citizenAvatar}
            alt={citizenName}
            className="h-14 w-14 shrink-0 rounded-2xl border border-white/12 object-cover"
            onError={e => { e.currentTarget.src = '/avatar.jpg' }}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-semibold text-white">{citizenName}</div>
          </div>
          <button onClick={logout} className="settings-btn settings-btn--ghost shrink-0 px-3 py-1.5 text-sm">
            Sign out
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="settings-danger-zone">
        <button onClick={() => setDangerOpen(v => !v)} className="settings-danger-zone-header w-full">
          <DangerLabel />
          <Chevron open={dangerOpen} />
        </button>

        {dangerOpen && (
          <div className="settings-danger-zone-body space-y-2">

            {/* One row per VPORT */}
            {vports.map(vport => (
              <VportDangerRow
                key={vport.id}
                vport={vport}
                onSoftDelete={() => setSoftTarget(vport)}
                onHardDelete={() => setHardTarget(vport)}
                onRestore={() => setRestoreTarget(vport)}
              />
            ))}

            {(errSoft || errHard || errRestore) && (
              <div className="settings-danger-error px-3 py-2 text-sm">{errSoft || errHard || errRestore}</div>
            )}

            {/* Delete account */}
            <div className="settings-danger-row rounded-xl p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-rose-100">Delete account</div>
                  <div className="mt-0.5 text-xs text-rose-100/70">
                    Removes your profile, posts, messages, and all VPORTs permanently.
                  </div>
                </div>
                <button
                  onClick={() => setShowConfirmAccount(true)}
                  className="settings-btn settings-btn--danger shrink-0 px-3 py-1.5 text-sm"
                >
                  Delete…
                </button>
              </div>
              {errAccount && (
                <div className="settings-danger-error mt-2 px-3 py-2 text-sm">{errAccount}</div>
              )}
            </div>

          </div>
        )}
      </div>

      {softTarget && (
        <SoftDeleteModal
          vport={softTarget}
          busy={busySoft}
          onCancel={() => !busySoft && setSoftTarget(null)}
          onConfirm={handleSoftConfirm}
        />
      )}

      {hardTarget && (
        <HardDeleteModal
          vport={hardTarget}
          busy={busyHard}
          onCancel={() => !busyHard && setHardTarget(null)}
          onConfirm={handleHardConfirm}
        />
      )}

      {restoreTarget && (
        <RestoreModal
          vport={restoreTarget}
          busy={busyRestore}
          onCancel={() => !busyRestore && setRestoreTarget(null)}
          onConfirm={handleRestoreConfirm}
        />
      )}

      {showConfirmAccount && (
        <DeleteModal
          title="Delete your account"
          busy={busyAccount}
          onCancel={() => !busyAccount && setShowConfirmAccount(false)}
          onConfirm={deleteAccount}
          confirmLabel="Delete account"
        >
          <p className="text-sm text-white/70">
            This will permanently delete your profile, all Vibes, Vox, VPORTs, and any content
            associated with your account.
          </p>
          <p className="mt-2 text-sm text-rose-300/80">This cannot be undone.</p>
        </DeleteModal>
      )}
    </div>
  )
}

