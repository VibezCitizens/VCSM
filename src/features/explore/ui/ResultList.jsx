import { useSearchTabsActor } from '@/features/explore/hooks/useSearchTabsActor'
import ActorSearchResultRow from './ActorSearchResultRow'
import WanderCardSearch from '@/features/explore/ui/features/WanderCardSearch'
import EmptyState from '@/features/explore/ui/EmptyState'

export default function ResultList({ query, filter }) {
  const { items, loading } = useSearchTabsActor({ query, filter })

  if (!query) return null
  if (loading) return <div className="text-center text-slate-400">Loading...</div>
  if (!items?.length) return <EmptyState />

  return (
    <div className="space-y-2">
      {items.map((it) => {
        if (!it) return null

        if (it.result_type === 'feature') {
          if (it.id === 'wanders') {
            return <WanderCardSearch key="feature:wanders" query={query} />
          }
          return null
        }

        if (it.result_type === 'actor') {
          return <ActorSearchResultRow key={`actor:${it.actor_id}`} actor={it} />
        }

        return null
      })}
    </div>
  )
}
