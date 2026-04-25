import { useState } from 'react'
import { useVportsList } from '@/features/settings/vports/hooks/useVportsList'
import { useAccountController } from '@/features/settings/account/hooks/useAccountController'

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

// ── Sub-components ───────────────────────────────────────

function VportDangerRow({ vport, onSoftDelete, onHardDelete, onRestore }) {
  return (
    <div className="settings-danger-row rounded-xl p-3">
      <div className="flex items-center gap-3">
        <img
          src={vport.avatar_url || '/avatar.jpg'}
          alt={vport.name}
          className="h-9 w-9 shrink-0 rounded-lg border border-white/10 object-cover"
          onError={e => { e.currentTarget.src = '/avatar.jpg' }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="truncate text-sm font-semibold text-rose-100">{vport.name}</span>
            {vport.is_deleted && (
              <span className="settings-status-badge settings-status-badge--inactive shrink-0">Deactivated</span>
            )}
          </div>
          <div className="truncate text-xs text-rose-100/50">@{vport.slug}</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {vport.is_deleted ? (
            <>
              <button
                onClick={onRestore}
                className="settings-btn settings-btn--ghost px-2.5 py-1.5 text-xs"
              >
                Restore
              </button>
              <button
                onClick={onHardDelete}
                className="settings-btn settings-btn--danger px-2.5 py-1.5 text-xs"
              >
                Delete permanently
              </button>
            </>
          ) : (
            <button
              onClick={onSoftDelete}
              className="settings-btn settings-btn--ghost px-2.5 py-1.5 text-xs"
              style={{ color: '#fcd34d', borderColor: 'rgba(217,119,6,0.35)' }}
            >
              Deactivate…
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SoftDeleteModal({ vport, busy, onCancel, onConfirm }) {
  return (
    <DeleteModal
      title="Deactivate this VPORT?"
      busy={busy}
      busyLabel="Deactivating…"
      onCancel={onCancel}
      onConfirm={onConfirm}
      confirmLabel="Deactivate VPORT"
      confirmClassName="settings-btn border border-amber-500/40 bg-amber-500/15 text-amber-300"
    >
      <p className="text-sm text-white/70">
        <span className="font-semibold text-white">{vport.name}</span> will be hidden from public
        pages and you won't be able to switch into it. You can restore it later from this screen.
      </p>
    </DeleteModal>
  )
}

function HardDeleteModal({ vport, busy, onCancel, onConfirm }) {
  const [confirmText, setConfirmText] = useState('')
  const canConfirm = confirmText.trim() === vport.name.trim()

  return (
    <DeleteModal
      title="Permanently delete this VPORT?"
      busy={busy}
      busyLabel="Deleting…"
      onCancel={onCancel}
      onConfirm={onConfirm}
      confirmLabel="Delete permanently"
      confirmDisabled={!canConfirm}
    >
      <p className="text-sm text-white/70">
        All data for <span className="font-semibold text-white">{vport.name}</span> will be
        destroyed — services, reviews, menus, media, and posts.
      </p>
      <p className="mt-2 text-sm font-semibold text-rose-300">This is permanent and cannot be undone.</p>
      <div className="mt-3 space-y-1.5">
        <label className="block text-xs text-white/50">
          Type <span className="font-semibold text-white/80">{vport.name}</span> to confirm
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder={vport.name}
          className="settings-input w-full rounded-xl px-3 py-2 text-sm"
        />
      </div>
    </DeleteModal>
  )
}

function RestoreModal({ vport, busy, onCancel, onConfirm }) {
  return (
    <DeleteModal
      title="Restore this VPORT?"
      busy={busy}
      busyLabel="Restoring…"
      onCancel={onCancel}
      onConfirm={onConfirm}
      confirmLabel="Restore VPORT"
      confirmClassName="settings-btn settings-btn--primary"
    >
      <p className="text-sm text-white/70">
        <span className="font-semibold text-white">{vport.name}</span> will become publicly visible
        again and you'll be able to switch into it.
      </p>
    </DeleteModal>
  )
}

function DeleteModal({ title, busy, busyLabel, onCancel, onConfirm, confirmLabel, confirmClassName, confirmDisabled, children }) {
  const btnClass = confirmClassName ?? 'settings-btn settings-btn--danger'
  const activeBusyLabel = busyLabel ?? 'Deleting…'
  const isDisabled = busy || !!confirmDisabled

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="settings-shell mx-4 w-full max-w-md rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/8 p-4">
          <div className="text-sm font-semibold text-white">{title}</div>
          <button onClick={onCancel} disabled={busy} className="settings-btn settings-btn--ghost px-2 py-1 text-sm">✕</button>
        </div>
        <div className="p-4">{children}</div>
        <div className="flex justify-end gap-2 border-t border-white/8 p-4">
          <button onClick={onCancel} disabled={busy} className="settings-btn settings-btn--ghost px-3 py-1.5 text-sm">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={isDisabled}
            className={`${btnClass} px-3 py-1.5 text-sm`}
            style={isDisabled ? { opacity: 0.45, cursor: 'not-allowed', transform: 'none' } : {}}
          >
            {busy ? activeBusyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function DangerLabel() {
  return (
    <div className="flex items-center gap-2">
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#fca5a5" strokeWidth="1.6">
        <path d="M8 2L2 14h12L8 2z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 7v3" strokeLinecap="round" />
        <circle cx="8" cy="12" r="0.6" fill="#fca5a5" stroke="none" />
      </svg>
      <span className="text-sm font-semibold text-rose-200/80">Danger zone</span>
    </div>
  )
}

function Chevron({ open }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 16 16"
      fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.6"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
    >
      <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
