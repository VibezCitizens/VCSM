// ============================================================
//  SETTINGS — ACCOUNT TAB (VIEW)
// ------------------------------------------------------------
//  @File: AccountTab.view.jsx
//  @System: Settings / Account
//  @RefactorBatch: 2025-12
//  @Status: FINAL
//  @Scope:
//    • Account session controls
//    • Account deletion
//    • VPORT deletion
// ------------------------------------------------------------
//  RULES:
//   • No direct auth / identity logic
//   • No DB access
//   • Controller owns behavior
// ============================================================

import Card from '@/features/settings/ui/Card'
import Row  from '@/features/settings/ui/Row'

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

      {/* ================= SESSION ================= */}
      <Card>
        <Row
          title="Sign out"
          subtitle="Ends your current session"
          right={
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-sm"
            >
              Log out
            </button>
          }
        />
      </Card>

      {/* ================= DANGER: DELETE VPORT ================= */}
      {isVport && (
        <Card>
          <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-3">
            <Row
              title={
                <span className="text-red-300 font-semibold">
                  Delete VPORT
                </span>
              }
              subtitle={
                <span className="text-red-200/80">
                  Permanently delete this VPORT and all associated data.
                  <span className="text-red-300 font-medium">
                    {' '}This cannot be undone.
                  </span>
                </span>
              }
              right={
                <button
                  onClick={() => setShowConfirmVport(true)}
                  className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
                >
                  Delete…
                </button>
              }
            />

            {errVport && (
              <div className="mt-2 rounded-lg border border-red-900 bg-red-950/60 text-red-200 px-3 py-2 text-sm">
                {errVport}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ================= DANGER: DELETE ACCOUNT ================= */}
      <Card>
        <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-3">
          <Row
            title={
              <span className="text-red-300 font-semibold">
                Delete account
              </span>
            }
            subtitle="Permanently delete your account and all associated data."
            right={
              <button
                onClick={() => setShowConfirmAccount(true)}
                className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
              >
                Delete…
              </button>
            }
          />

          {errAccount && (
            <div className="mt-2 rounded-lg border border-red-900 bg-red-950/60 text-red-200 px-3 py-2 text-sm">
              {errAccount}
            </div>
          )}
        </div>
      </Card>

      {/* ================= CONFIRM MODALS ================= */}
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

/* ============================================================
   CONFIRM MODAL (LOCAL, PURE UI)
   ============================================================ */

function ConfirmModal({
  title,
  busy,
  onCancel,
  onConfirm,
  children,
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center">
      <div className="max-w-md w-full mx-4 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-zinc-800">
          <div className="font-semibold text-sm">
            {title}
          </div>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        <div className="p-4 text-sm text-zinc-300">
          {children}
        </div>

        <div className="flex justify-end gap-2 p-4">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-3 py-1.5 bg-zinc-800 rounded"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="px-3 py-1.5 bg-red-600 rounded"
          >
            {busy ? 'Deleting…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
