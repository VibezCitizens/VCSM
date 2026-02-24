// src/features/settings/privacy/ui/UserLookup.jsx

import { useCallback, useMemo, useState } from 'react'
import { ctrlSearchActors } from '@/features/settings/privacy/controller/Blocks.controller'
import { useMyBlocks } from '@/features/settings/privacy/hooks/useMyBlocks'
import ActorLink from '@/shared/components/ActorLink'
import { useActorSummary } from '@/state/actors/useActorSummary'

export default function UserLookup() {
  const { loading, error, blockedIds, block, unblock } = useMyBlocks()

  const [q, setQ] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState([])
  const [searchErr, setSearchErr] = useState(null)

  const runSearch = useCallback(async () => {
    const query = (q || '').trim()
    if (!query) {
      setResults([])
      return
    }

    setSearching(true)
    setSearchErr(null)
    try {
      const r = await ctrlSearchActors({ query })
      setResults(r)
    } catch (e) {
      setSearchErr(e?.message || String(e))
    } finally {
      setSearching(false)
    }
  }, [q])

  const hint = useMemo(() => {
    if (searching) return 'Searching...'
    return 'Search by username or display name'
  }, [searching])

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => (e.key === 'Enter' ? runSearch() : null)}
          placeholder={hint}
          className="settings-input w-full rounded-lg px-3 py-2 text-sm"
        />
        <button
          onClick={runSearch}
          className="settings-btn settings-btn--ghost px-3 py-2 text-sm"
        >
          Search
        </button>
      </div>

      {(error || searchErr) && (
        <div className="text-xs text-red-400">
          {error || searchErr}
        </div>
      )}

      <div className="space-y-2">
        {results.map((r) => (
          <LookupRow
            key={r.actorId}
            actorId={r.actorId}
            displayName={r.displayName}
            username={r.username}
            isBlocked={blockedIds.has(r.actorId)}
            onBlock={() => block(r.actorId)}
            onUnblock={() => unblock(r.actorId)}
            busy={loading}
          />
        ))}

        {!searching && results.length === 0 && (
          <div className="text-xs text-zinc-500">No results yet.</div>
        )}
      </div>
    </div>
  )
}

function LookupRow({ actorId, displayName, username, isBlocked, onBlock, onUnblock, busy }) {
  const actor = useActorSummary(actorId)

  const name = actor?.displayName || displayName
  const handle = actor?.username || username

  return (
    <div className="settings-card-surface flex items-center justify-between gap-3 rounded-lg px-3 py-2">
      <div className="min-w-0">
        {actor?.actorId ? (
          <ActorLink actor={actor} avatarSize="w-8 h-8" />
        ) : (
          <div className="text-sm text-zinc-200 truncate">{name}</div>
        )}
        {handle && <div className="text-xs text-zinc-500 truncate">@{handle}</div>}
        {!handle && <div className="text-xs text-zinc-600 truncate">{actorId}</div>}
      </div>

      {isBlocked ? (
        <button
          onClick={busy ? undefined : onUnblock}
          disabled={busy}
          className={`rounded-lg border px-3 py-1.5 text-xs ${
            busy
              ? 'border-slate-600/30 text-slate-500'
              : 'settings-btn settings-btn--danger'
          }`}
        >
          Unblock
        </button>
      ) : (
        <button
          onClick={busy ? undefined : onBlock}
          disabled={busy}
          className={`rounded-lg border px-3 py-1.5 text-xs ${
            busy
              ? 'border-slate-600/30 text-slate-500'
              : 'settings-btn settings-btn--ghost'
          }`}
        >
          Block
        </button>
      )}
    </div>
  )
}
