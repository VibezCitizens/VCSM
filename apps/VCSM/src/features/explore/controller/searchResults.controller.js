import { searchDal } from '@/features/explore/dal/search.dal'
import { dedupeByKindAndId, normalizeResult } from '@/features/explore/model/search.model'
import { hydrateActorsByIds } from '@hydration'

export async function ctrlSearchResults({ query, filter }) {
  const trimmed = String(query || '').trim()
  if (!trimmed) return []

  const responses = await Promise.all(searchDal(trimmed, filter, {}))

  const allRows = responses.flat()

  const actorIds = allRows
    .filter((r) => r && r.result_type === 'actor')
    .map((r) => r.actorId || r.actor_id)
    .filter(Boolean)
  if (actorIds.length) hydrateActorsByIds(actorIds).catch(() => {})

  const normalized = allRows
    .map(normalizeResult)
    .filter(Boolean)

  const features = buildFeatureResults(trimmed, filter)
    .map(normalizeResult)
    .filter(Boolean)

  return dedupeByKindAndId([...features, ...normalized])
}

function buildFeatureResults(query, activeFilter) {
  const needle = String(query || '').trim().toLowerCase()
  if (!needle) return []
  if (activeFilter !== 'all') return []

  const wantsWanders =
    needle.includes('wander') ||
    needle.includes('wanders') ||
    needle.startsWith('@wander') ||
    needle === 'w'

  if (!wantsWanders) return []

  return [
    {
      result_type: 'feature',
      id: 'wanders',
      title: 'Wanders',
      subtitle: 'Explore nearby Wanders',
      icon: 'at-bubble',
      route: '/wanders',
    },
  ]
}
