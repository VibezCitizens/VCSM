// src/features/settings/privacy/ui/UserLookup.jsx

import { useCallback, useMemo, useState } from 'react'
import { ctrlSearchActors } from '@/features/settings/privacy/controller/Blocks.controller'
import { useMyBlocks } from '@/features/settings/privacy/hooks/useMyBlocks'
import ActorLink from '@/shared/components/ActorLink'
import { useActorPresentation } from '@/state/actors/useActorPresentation'

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
    if (searching) return 'Searching…'
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
          className="w-full rounded-lg border border-zinc-800 bg-neutral-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600"
        />
        <button
          onClick={runSearch}
          className="rounded-lg border border-zinc-800 bg-neutral-900 px-3 py-2 text-sm text-zinc-200 hover:bg-neutral-800"
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
  // If you have actor store SSOT, prefer that presentation
  const actor = useActorPresentation(actorId)

  const name = actor?.displayName || displayName
  const handle = actor?.username || username

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-neutral-950/40 px-3 py-2">
      <div className="min-w-0">
        {actor ? (
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
              ? 'border-zinc-800 text-zinc-600'
              : 'border-red-900/60 bg-red-950/30 text-red-200 hover:bg-red-950/50'
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
              ? 'border-zinc-800 text-zinc-600'
              : 'border-zinc-700 bg-neutral-900 text-zinc-200 hover:bg-neutral-800'
          }`}
        >
          Block
        </button>
      )}
    </div>
  )
}
