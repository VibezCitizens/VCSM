import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIdentity } from '@/state/identity/identityContext'
import { ctrlResolveVportIdByActorId, ctrlRestoreVport } from '@/features/settings/account/controller/account.controller'

export default function RestoreVportScreen() {
  const navigate = useNavigate()
  const { identity, switchActor, blockedVport } = useIdentity()

  const [vportId, setVportId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!identity?.actorId) return
    ctrlResolveVportIdByActorId(identity.actorId)
      .then((id) => setVportId(id))
      .catch(() => {})
  }, [identity?.actorId])

  // If not actually blocked, redirect away
  useEffect(() => {
    if (!blockedVport && identity) {
      navigate('/feed', { replace: true })
    }
  }, [blockedVport, identity, navigate])

  async function handleRestore() {
    if (!vportId) return
    setBusy(true)
    setErr('')
    try {
      await ctrlRestoreVport({ vportId })
      await switchActor(identity.actorId, 'RestoreVportScreen.handleRestore')
      navigate('/feed', { replace: true })
    } catch (e) {
      setErr(e?.message || 'Could not restore VPORT. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSwitchToProfile() {
    navigate('/settings?tab=account', { replace: true })
  }

  const displayName = identity?.displayName ?? 'This VPORT'
  const reason = identity?.isDeleted
    ? 'This VPORT has been soft-deleted and is no longer publicly visible.'
    : identity?.isVoid
    ? 'This VPORT has been voided.'
    : 'This VPORT is currently inactive.'

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="text-4xl mb-2">⚠️</div>
          <h1 className="text-xl font-bold text-white">{displayName}</h1>
          <p className="text-sm text-white/60">{reason}</p>
        </div>

        {err && (
          <p className="text-sm text-red-400 text-center">{err}</p>
        )}

        <div className="space-y-3">
          {identity?.isDeleted && vportId && (
            <button
              onClick={handleRestore}
              disabled={busy}
              className="w-full py-3 rounded-xl bg-purple-600 text-white font-semibold text-sm disabled:opacity-50"
            >
              {busy ? 'Restoring…' : 'Restore VPORT'}
            </button>
          )}

          <button
            onClick={handleSwitchToProfile}
            className="w-full py-3 rounded-xl border border-white/12 text-white/70 text-sm"
          >
            Go to Account Settings
          </button>
        </div>
      </div>
    </div>
  )
}
