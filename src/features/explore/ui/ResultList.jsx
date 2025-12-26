// src/features/explore/ui/ResultList.jsx

import { useSearchTabsActor } from '@/features/explore/hooks/useSearchTabsActor'
import ActorSearchResultRow from './ActorSearchResultRow'
import EmptyState from '@/features/explore/ui/EmptyState'

export default function ResultList({ query, filter }) {
  const { items, loading } = useSearchTabsActor({
    query,
    filter,
  })

  if (!query) return null
  if (loading) {
    return <div className="text-center text-zinc-400">Loading…</div>
  }

  const actors = items.filter(
    item => item?.result_type === 'actor' && item.actor_id
  )

  if (!actors.length) return <EmptyState />

  return (
    <div className="divide-y divide-white/10">
      {actors.map(actor => (
        <ActorSearchResultRow
          key={actor.actor_id}
          actor={actor}
        />
      ))}
    </div>
  )
}
