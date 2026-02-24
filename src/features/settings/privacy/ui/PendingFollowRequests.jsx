import { useEffect, useState } from 'react'
import { useIncomingFollowRequests } from '@/features/social/friend/request/hooks/useIncomingFollowRequests'
import {
  ctrlAcceptFollowRequest,
  ctrlDeclineFollowRequest,
} from '@/features/social/friend/request/controllers/followRequests.controller'

import { hydrateActorsFromRows } from '@/features/actors/controllers/hydrateActors.controller'
import { useActorSummary } from '@/state/actors/useActorSummary'
import ActorLink from '@/shared/components/ActorLink'

export default function PendingFollowRequests({ actorId }) {
  const { requests, loading } = useIncomingFollowRequests(actorId)
  const [hidden, setHidden] = useState(() => new Set())

  useEffect(() => {
    if (!actorId) return
    if (!Array.isArray(requests) || requests.length === 0) return

    hydrateActorsFromRows(requests.map((r) => ({ actorId: r.requesterActorId })))
  }, [actorId, requests])

  if (!actorId) return null
  if (loading) return null

  const visibleRequests = requests.filter((r) => !hidden.has(r.requesterActorId))
  if (visibleRequests.length === 0) return null

  return (
    <section className="settings-card-surface rounded-xl p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-100">Pending follow requests</h3>

      <div className="space-y-2">
        {visibleRequests.map((req) => (
          <RequestRow
            key={req.requesterActorId}
            requesterActorId={req.requesterActorId}
            targetActorId={req.targetActorId}
            onOptimisticHide={() => setHidden((prev) => new Set(prev).add(req.requesterActorId))}
          />
        ))}
      </div>
    </section>
  )
}

function RequestRow({ requesterActorId, targetActorId, onOptimisticHide }) {
  const actor = useActorSummary(requesterActorId)
  const [busy, setBusy] = useState(false)

  async function accept() {
    if (busy) return
    setBusy(true)
    onOptimisticHide()

    try {
      await ctrlAcceptFollowRequest({ requesterActorId, targetActorId })
    } catch (err) {
      console.error('Accept failed', err)
    }
  }

  async function decline() {
    if (busy) return
    setBusy(true)
    onOptimisticHide()

    try {
      await ctrlDeclineFollowRequest({ requesterActorId, targetActorId })
    } catch (err) {
      console.error('Decline failed', err)
    }
  }

  return (
    <div className="settings-card-surface flex items-center justify-between gap-3 rounded-lg px-3 py-2">
      <div className="min-w-0 flex items-center gap-2">
        {actor?.actorId ? (
          <ActorLink actor={actor} avatarSize="w-8 h-8" avatarShape="rounded-lg" />
        ) : (
          <div className="truncate text-sm text-slate-200">{requesterActorId}</div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={accept}
          className="settings-btn border border-emerald-300/35 bg-emerald-600/20 px-3 py-1.5 text-xs text-emerald-100 hover:bg-emerald-600/30 disabled:opacity-50"
        >
          Accept
        </button>

        <button
          disabled={busy}
          onClick={decline}
          className="settings-btn settings-btn--ghost px-3 py-1.5 text-xs disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    </div>
  )
}
