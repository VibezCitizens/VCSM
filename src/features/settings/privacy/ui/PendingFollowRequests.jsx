// src/features/settings/privacy/ui/PendingFollowRequests.jsx
// ============================================================
// Pending Follow Requests (ACTOR-BASED)
// ------------------------------------------------------------
// - Shows incoming follow requests
// - Accept / Decline actions
// - Optimistic UI (instant removal)
// ============================================================

import { useEffect, useState } from 'react'
import { useIncomingFollowRequests } from '@/features/social/friend/request/hooks/useIncomingFollowRequests'
import {
  ctrlAcceptFollowRequest,
  ctrlDeclineFollowRequest,
} from '@/features/social/friend/request/controllers/followRequests.controller'

import { hydrateActorsFromRows } from '@/features/actors/controllers/hydrateActors.controller'
import { useActorPresentation } from '@/state/actors/useActorPresentation'
import ActorLink from '@/shared/components/ActorLink'

export default function PendingFollowRequests({ actorId }) {
  if (!actorId) return null

  const { requests, loading } = useIncomingFollowRequests(actorId)

  // 🔥 optimistic removal state
  const [hidden, setHidden] = useState(() => new Set())

  // ------------------------------------------------------------
  // Hydrate requester actors
  // ------------------------------------------------------------
  useEffect(() => {
    if (!Array.isArray(requests) || requests.length === 0) return

    hydrateActorsFromRows(
      requests.map(r => ({ actorId: r.requesterActorId }))
    )
  }, [requests])

  if (loading) return null

  // Apply optimistic filtering
  const visibleRequests = requests.filter(
    r => !hidden.has(r.requesterActorId)
  )

  if (visibleRequests.length === 0) return null

  return (
    <section className="rounded-xl border border-zinc-800 bg-neutral-900/60 p-4">
      <h3 className="text-sm font-semibold mb-2">
        Pending follow requests
      </h3>

      <div className="space-y-2">
        {visibleRequests.map(req => (
          <RequestRow
            key={req.requesterActorId}
            requesterActorId={req.requesterActorId}
            targetActorId={req.targetActorId}
            onOptimisticHide={() =>
              setHidden(prev => new Set(prev).add(req.requesterActorId))
            }
          />
        ))}
      </div>
    </section>
  )
}

/* ============================================================
   ROW
   ============================================================ */
function RequestRow({
  requesterActorId,
  targetActorId,
  onOptimisticHide,
}) {
  const actor = useActorPresentation(requesterActorId)
  const [busy, setBusy] = useState(false)

  async function accept() {
    if (busy) return
    setBusy(true)

    // 🚀 optimistic remove
    onOptimisticHide()

    try {
      await ctrlAcceptFollowRequest({
        requesterActorId,
        targetActorId,
      })
    } catch (err) {
      console.error('Accept failed', err)
      // optional: rollback (Phase 2)
    }
  }

  async function decline() {
    if (busy) return
    setBusy(true)

    // 🚀 optimistic remove
    onOptimisticHide()

    try {
      await ctrlDeclineFollowRequest({
        requesterActorId,
        targetActorId,
      })
    } catch (err) {
      console.error('Decline failed', err)
      // optional: rollback
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-neutral-950/40 px-3 py-2">
      <div className="min-w-0 flex items-center gap-2">
        {actor ? (
          <ActorLink
            actor={actor}
            avatarSize="w-8 h-8"
            avatarShape="rounded-lg"
          />
        ) : (
          <div className="text-sm text-zinc-200 truncate">
            {requesterActorId}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={accept}
          className="rounded-lg border border-emerald-700 bg-emerald-900/40
                     px-3 py-1.5 text-xs text-emerald-200
                     hover:bg-emerald-900/60 disabled:opacity-50"
        >
          Accept
        </button>

        <button
          disabled={busy}
          onClick={decline}
          className="rounded-lg border border-zinc-700 bg-neutral-900
                     px-3 py-1.5 text-xs text-zinc-300
                     hover:bg-neutral-800 disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    </div>
  )
}
