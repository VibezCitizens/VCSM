import { useAccountController } from '../controller/Account.controller'

export default function AccountTabView() {
  const ctrl = useAccountController()
  const {
    isVport,
    showConfirmAccount,
    busyAccount,
    errAccount,
    showConfirmVport,
    busyVport,
    errVport,
    setShowConfirmAccount,
    setShowConfirmVport,
    logout,
    deleteAccount,
    deleteVport,
  } = ctrl

  return (
    <div className="space-y-4">
      <section className="settings-card-surface rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-100">Sign out</div>
            <div className="mt-1 text-sm text-slate-300">Ends your current session</div>
          </div>
          <button onClick={logout} className="settings-btn settings-btn--ghost px-3 py-1.5 text-sm">
            Log out
          </button>
        </div>
      </section>

      {isVport && (
        <section className="settings-danger-surface rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold text-rose-100">Delete VPORT</div>
              <div className="mt-1 text-sm leading-relaxed text-rose-100/80">
                Permanently delete this VPORT and all associated data. This cannot be undone.
              </div>
            </div>
            <button
              onClick={() => setShowConfirmVport(true)}
              className="settings-btn settings-btn--danger px-3 py-1.5 text-sm"
            >
              Delete...
            </button>
          </div>
          {errVport && (
            <div className="settings-danger-error mt-2 px-3 py-2 text-sm">
              {errVport}
            </div>
          )}
        </section>
      )}

      <section className="settings-danger-surface rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold text-rose-100">Delete account</div>
            <div className="mt-1 text-sm leading-relaxed text-rose-100/80">
              Permanently delete your account and all associated data.
            </div>
          </div>
          <button
            onClick={() => setShowConfirmAccount(true)}
            className="settings-btn settings-btn--danger px-3 py-1.5 text-sm"
          >
            Delete...
          </button>
        </div>
        {errAccount && (
          <div className="settings-danger-error mt-2 px-3 py-2 text-sm">
            {errAccount}
          </div>
        )}
      </section>

      {showConfirmAccount && (
        <ConfirmModal
          title="Delete account"
          busy={busyAccount}
          onCancel={() => !busyAccount && setShowConfirmAccount(false)}
          onConfirm={deleteAccount}
        >
          This removes your profile, Vibes, and Vox permanently.
        </ConfirmModal>
      )}

      {showConfirmVport && (
        <ConfirmModal
          title="Delete VPORT"
          busy={busyVport}
          onCancel={() => !busyVport && setShowConfirmVport(false)}
          onConfirm={deleteVport}
        >
          This removes this VPORT and all associated data permanently.
        </ConfirmModal>
      )}
    </div>
  )
}

function ConfirmModal({ title, busy, onCancel, onConfirm, children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="settings-shell mx-4 w-full max-w-md rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-300/10 p-4">
          <div className="text-sm font-semibold text-slate-100">{title}</div>
          <button onClick={onCancel} className="settings-btn settings-btn--ghost px-2 py-1 text-sm">
            x
          </button>
        </div>

        <div className="p-4 text-sm text-slate-300">{children}</div>

        <div className="flex justify-end gap-2 p-4">
          <button onClick={onCancel} disabled={busy} className="settings-btn settings-btn--ghost px-3 py-1.5">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy} className="settings-btn settings-btn--danger px-3 py-1.5">
            {busy ? 'Deleting...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
