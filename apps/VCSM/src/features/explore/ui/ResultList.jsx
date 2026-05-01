import { useSearchTabsActor } from '@/features/explore/hooks/useSearchTabsActor'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import ActorSearchResultRow from './ActorSearchResultRow'
import WanderCardSearch from '@/features/explore/ui/features/WanderCardSearch'
import EmptyState from '@/features/explore/ui/EmptyState'
import FeaturedResultCard from './FeaturedResultCard'
import { SkeletonRow } from '@/shared/components/Skeleton'

export default function ResultList({ query, filter }) {
  const { identity } = useIdentity()
  const viewerActorId = identity?.actorId ?? null
  const { items, loading } = useSearchTabsActor({ query, filter, viewerActorId })

  if (!query) return null
  if (loading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={`sr:${i}`} />)}</div>
  if (!items?.length) return <EmptyState />

  const [featured, ...rest] = items

  return (
    <div className="explore-results-stack">
      {featured ? <FeaturedResultCard item={featured} /> : null}

      {rest.map((it) => {
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
