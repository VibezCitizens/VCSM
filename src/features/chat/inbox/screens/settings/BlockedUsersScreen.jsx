// src/features/chat/inbox/screens/settings/BlockedUsersScreen.jsx
// ============================================================
// BlockedUsersScreen (Chat Settings)
// ------------------------------------------------------------
// - Shows actors you blocked
// - Allows unblocking (confirm modal)
// - Uses existing settings/privacy block stack (useMyBlocks)
// ============================================================

import { useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

import { useIdentity } from '@/state/identity/identityContext'
import { MyBlocksProvider, useMyBlocks } from '@/features/settings/privacy/hooks/useMyBlocks'
import { useActorSummary } from '@/state/actors/useActorSummary'
import BlockConfirmModal from '@/features/block/ui/BlockConfirmModal'
import '@/features/ui/modern/module-modern.css'

function BlockedRow({ blockedActorId, onUnblock }) {
  const actor = useActorSummary(blockedActorId)

  return (
    <div className="flex w-full items-center gap-3 px-4 py-3">
      <img
        src={actor?.avatar || '/avatar.jpg'}
        alt=""
        className="h-10 w-10 rounded-xl border border-slate-300/15 bg-black/30 object-cover"
      />

      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-slate-100">
          {actor?.displayName || actor?.username || 'Unknown'}
        </div>

        <div className="truncate text-xs text-slate-400">
          {actor?.username ? `@${actor.username}` : ''}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onUnblock(blockedActorId)}
        className="rounded-xl border border-slate-300/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5"
      >
        Unblock
      </button>
    </div>
  )
}

function BlockedUsersBody() {
  const navigate = useNavigate()
  const { loading, error, blocks, unblock } = useMyBlocks()

  const [confirm, setConfirm] = useState(null)
  const [working, setWorking] = useState(false)

  const blockedActorIds = useMemo(
    () => (blocks ?? []).map((b) => b.blockedActorId).filter(Boolean),
    [blocks]
  )

  const openUnblockConfirm = useCallback((targetActorId) => {
    if (!targetActorId) return
    setConfirm({ targetActorId })
  }, [])

  const closeConfirm = useCallback(() => setConfirm(null), [])

  const handleConfirmUnblock = useCallback(async () => {
    const targetActorId = confirm?.targetActorId
    if (!targetActorId) return

    try {
      setWorking(true)
      await unblock(targetActorId)
      closeConfirm()
    } finally {
      setWorking(false)
    }
  }, [confirm, unblock, closeConfirm])

  return (
    <div className="module-modern-page flex h-full flex-col">
      <div className="module-modern-shell mx-auto flex h-full w-full max-w-2xl flex-col rounded-2xl">
        <header
          className="sticky top-0 z-20 border-b border-slate-300/10 bg-[#070b16]/75 backdrop-blur"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="relative flex h-14 items-center px-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="-ml-1 p-2 text-indigo-300 transition hover:text-indigo-200"
              aria-label="Back"
            >
              <ChevronLeft size={22} />
            </button>

            <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-slate-100">
              Blocked Citizens
            </h1>

            <div className="ml-auto w-10" />
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <div className="px-1 text-xs text-slate-500">
            Blocked Citizens can't Vox you, and you won't see their content.
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {String(error)}
            </div>
          ) : null}

          <div className="module-modern-card overflow-hidden rounded-2xl">
            {loading ? (
              <div className="px-4 py-4 text-sm text-slate-400">Loading...</div>
            ) : blockedActorIds.length === 0 ? (
              <div className="px-4 py-4 text-sm text-slate-400">
                You haven't blocked any Citizens.
              </div>
            ) : (
              blockedActorIds.map((id, idx) => (
                <div key={id}>
                  <BlockedRow blockedActorId={id} onUnblock={openUnblockConfirm} />
                  {idx !== blockedActorIds.length - 1 ? (
                    <div className="h-px bg-slate-300/10" />
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <BlockConfirmModal
        open={!!confirm}
        mode="unblock"
        targetActorId={confirm?.targetActorId}
        loading={working}
        onCancel={closeConfirm}
        onConfirm={handleConfirmUnblock}
      />
    </div>
  )
}

export default function BlockedUsersScreen() {
  const { identity } = useIdentity()
  const actorId = identity?.actorId ?? null

  return (
    <MyBlocksProvider scope="user" actorId={actorId}>
      <BlockedUsersBody />
    </MyBlocksProvider>
  )
}
