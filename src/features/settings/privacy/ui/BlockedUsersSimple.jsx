import { useMemo } from 'react'
import { useMyBlocks } from '@/features/settings/privacy/hooks/useMyBlocks'
import { useActorSummary } from '@/state/actors/useActorSummary'

export default function BlockedUsersSimple() {
  const { loading, error, blocks, unblock, refresh } = useMyBlocks()

  const empty = useMemo(() => !loading && (!blocks || blocks.length === 0), [loading, blocks])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-400">{loading ? 'Loading...' : `${blocks.length} blocked`}</div>

        <button onClick={refresh} className="settings-btn settings-btn--ghost px-3 py-1.5 text-xs">
          Refresh
        </button>
      </div>

      {error && <div className="text-xs text-rose-300">{error}</div>}

      {empty && <div className="text-sm italic text-slate-500">You have not blocked any Citizens.</div>}

      <div className="grid gap-3">
        {blocks.map((b) => (
          <BlockedUserCard
            key={b.id}
            actorId={b.blockedActorId}
            onUnblock={() => unblock(b.blockedActorId)}
            busy={loading}
          />
        ))}
      </div>
    </div>
  )
}

function BlockedUserCard({ actorId, onUnblock, busy }) {
  const actor = useActorSummary(actorId)

  return (
    <div className="settings-card-surface flex items-center justify-between gap-4 rounded-xl px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-800">
          {actor?.avatar ? (
            <img src={actor.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">N/A</div>
          )}
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-slate-200">{actor?.displayName || 'Unknown'}</div>
          {actor?.username && <div className="truncate text-xs text-slate-500">@{actor.username}</div>}
        </div>
      </div>

      <button
        onClick={busy ? undefined : onUnblock}
        disabled={busy}
        className={`settings-btn px-3 py-1.5 text-xs ${busy ? 'border border-slate-600/30 text-slate-500' : 'settings-btn--danger'}`}
      >
        Unblock
      </button>
    </div>
  )
}
