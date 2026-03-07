import { useState } from 'react'
import { useIncomingFollowRequests } from '@/features/social/friend/request/hooks/useIncomingFollowRequests'
import { usePendingFollowRequestActions } from '@/features/settings/privacy/hooks/usePendingFollowRequestActions'
import { useActorSummary } from '@/state/actors/useActorSummary'
import ActorLink from '@/shared/components/ActorLink'

export default function PendingFollowRequests({ actorId }) {
  const { requests, loading } = useIncomingFollowRequests(actorId)
  const [hidden, setHidden] = useState(() => new Set())
  const hide = (requesterActorId) =>
    setHidden((prev) => new Set(prev).add(requesterActorId))
  const unhide = (requesterActorId) =>
    setHidden((prev) => {
      const next = new Set(prev)
      next.delete(requesterActorId)
      return next
    })

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
            onOptimisticHide={() => hide(req.requesterActorId)}
            onRollbackHide={() => unhide(req.requesterActorId)}
          />
        ))}
      </div>
    </section>
  )
}

function RequestRow({
  requesterActorId,
  targetActorId,
  onOptimisticHide,
  onRollbackHide,
}) {
  const actor = useActorSummary(requesterActorId)
  const { busy, accept, decline } = usePendingFollowRequestActions({
    requesterActorId,
    targetActorId,
    onOptimisticHide,
    onRollbackHide,
  })

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
          className="settings-btn settings-btn--primary px-3 py-1.5 text-xs disabled:opacity-50"
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
