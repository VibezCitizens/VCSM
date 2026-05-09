import { useSearchTabsActor } from '@/features/explore/hooks/useSearchTabsActor'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import { useTranslation } from '@i18n'
import ActorSearchResultRow from './ActorSearchResultRow'
import PostCard from './PostCard'
import WanderCardSearch from '@/features/explore/ui/features/WanderCardSearch'
import EmptyState from '@/features/explore/ui/EmptyState'
import FeaturedResultCard from './FeaturedResultCard'
import { SkeletonRow } from '@/shared/components/Skeleton'

export default function ResultList({ query, filter }) {
  const { t } = useTranslation()
  const { identity } = useIdentity()
  const viewerActorId = identity?.actorId ?? null
  const { items, loading } = useSearchTabsActor({ query, filter, viewerActorId })

  if (!query) return null
  if (loading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={`sr:${i}`} />)}</div>
  if (!items?.length) return <EmptyState />

  // Hashtag mode: # prefix → only post cards, no actors mixed in
  const isHashtagSearch = query.trim().startsWith('#')

  if (isHashtagSearch) {
    const posts = items.filter((it) => it?.result_type === 'post')
    if (!posts.length) return <EmptyState />
    return (
      <div className="explore-results-stack">
        {posts.map((it) => <PostCard key={`post:${it.id}`} post={it} />)}
      </div>
    )
  }

  // General mode: split actors/features from posts for clean visual hierarchy
  const actorItems = items.filter((it) => it?.result_type === 'actor' || it?.result_type === 'feature')
  const postItems = items.filter((it) => it?.result_type === 'post')

  const [featured, ...restActors] = actorItems

  return (
    <div className="explore-results-stack">
      {featured ? <FeaturedResultCard item={featured} /> : null}

      {restActors.map((it) => {
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

      {postItems.length > 0 && (
        <>
          {actorItems.length > 0 && (
            <p className="explore-section-label">{t('explore.vibesSection')}</p>
          )}
          {postItems.map((it) => <PostCard key={`post:${it.id}`} post={it} />)}
        </>
      )}
    </div>
  )
}
