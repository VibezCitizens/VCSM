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

// existing blocks provider/hook
import { MyBlocksProvider, useMyBlocks } from '@/features/settings/privacy/hooks/useMyBlocks'

// actor UI lookup (already used in your BlockConfirmModal)
import { useActorPresentation } from '@/state/actors/useActorPresentation'

// confirm modal you already have
import BlockConfirmModal from '@/features/block/ui/BlockConfirmModal'

function BlockedRow({ blockedActorId, onUnblock }) {
  const actor = useActorPresentation(blockedActorId)

  return (
    <div className="w-full px-4 py-3 flex items-center gap-3">
      <img
        src={actor?.photoUrl || actor?.photo_url || '/avatar.jpg'}
        alt=""
        className="w-10 h-10 rounded-xl object-cover border border-white/10 bg-black/30"
      />

      <div className="min-w-0 flex-1">
        <div className="text-white font-medium truncate">
          {actor?.displayName || actor?.display_name || actor?.username || 'Unknown'}
        </div>

        <div className="text-xs text-neutral-400 truncate">
          {actor?.username ? `@${actor.username}` : actor?.kind ? `${actor.kind}` : ''}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onUnblock(blockedActorId)}
        className="rounded-xl px-3 py-1.5 text-sm border border-white/10 text-neutral-200 hover:bg-white/10"
      >
        Unblock
      </button>
    </div>
  )
}

function BlockedUsersBody() {
  const navigate = useNavigate()
  const { loading, error, blocks, unblock } = useMyBlocks()

  const [confirm, setConfirm] = useState(null) // { targetActorId }
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
    <div className="flex flex-col h-full">
      {/* HEADER (ChatHeader-style, centered title) */}
      <header
        className="
          sticky top-0 z-20
          bg-black/90 backdrop-blur
          border-b border-white/10
        "
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="relative h-14 px-3 flex items-center">
          {/* LEFT: Back */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              p-2 -ml-1 rounded-xl
              text-violet-400
              hover:bg-violet-500/15
              active:bg-violet-500/25
              transition
            "
            aria-label="Back"
          >
            <ChevronLeft size={22} />
          </button>

          {/* CENTER: Title */}
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white">
            Blocked Citizens
          </h1>

          {/* RIGHT: spacer */}
          <div className="ml-auto w-10" />
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="text-xs text-neutral-500 px-1">
          Blocked Citizens can’t Vox you, and you won’t see their content.
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {String(error)}
          </div>
        ) : null}

        <div className="rounded-2xl border border-white/10 overflow-hidden bg-neutral-900/40">
          {loading ? (
            <div className="px-4 py-4 text-sm text-neutral-400">Loading…</div>
          ) : blockedActorIds.length === 0 ? (
            <div className="px-4 py-4 text-sm text-neutral-400">
              You haven’t blocked any Citizens.
            </div>
          ) : (
            blockedActorIds.map((id, idx) => (
              <div key={id}>
                <BlockedRow blockedActorId={id} onUnblock={openUnblockConfirm} />
                {idx !== blockedActorIds.length - 1 ? (
                  <div className="h-px bg-white/10" />
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      {/* CONFIRM MODAL */}
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

  // scope/vportId are supported by your provider signature
  // for chat settings, we treat this as the user’s global blocks.
  return (
    <MyBlocksProvider scope="user" actorId={actorId} userId={identity?.profileId ?? null} vportId={null}>
      <BlockedUsersBody />
    </MyBlocksProvider>
  )
}
