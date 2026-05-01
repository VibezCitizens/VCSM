import { supabase } from '@/services/supabase/supabaseClient'
import { hydrateActorsByIds } from '@hydration'
import { normalizeActorRow } from '@/features/explore/model/search.model'

function mapFilter(filter) {
  if (filter === 'users' || filter === 'vports') return filter
  return 'all'
}

async function searchActors(rawQuery, opts = {}) {
  const { limit = 25, offset = 0, viewerActorId = null, filter = 'all' } = opts

  const q = (rawQuery || '').trim()
  if (!q) return []

  const needle = (q.startsWith('@') || q.startsWith('#')) ? q.slice(1) : q
  if (!needle) return []

  const { data, error } = await supabase
    .schema('identity')
    .rpc('search_actor_directory', {
      p_viewer_domain: 'vc',
      p_viewer_actor_id: viewerActorId,
      p_query: needle,
      p_filter: mapFilter(filter),
      p_limit: limit,
      p_offset: offset,
    })

  if (error) {
    if (import.meta.env.DEV) {
      console.warn('[search.dal] search_actor_directory failed:', error.message)
    }
    throw error
  }

  const rows = (Array.isArray(data) ? data : [])
    .map(normalizeActorRow)
    .filter(Boolean)

  const seen = new Set()
  const deduped = rows.filter((r) => {
    const key = `${r.actorDomain}:${r.actorId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const actorIds = deduped.map((r) => r.actorId).filter(Boolean)
  if (actorIds.length) {
    hydrateActorsByIds(actorIds).catch(() => {})
  }

  return deduped
}

export function searchDal(query, filter, opts = {}) {
  switch (filter) {
    case 'users':
      return [searchActors(query, { ...opts, filter: 'users' })]
    case 'vports':
      return [searchActors(query, { ...opts, filter: 'vports' })]
    case 'posts':
      return [Promise.resolve([])]
    case 'videos':
      return [Promise.resolve([])]
    case 'groups':
      return [Promise.resolve([])]
    case 'all':
    default:
      return [
        searchActors(query, { ...opts, filter: 'all' }),
        Promise.resolve([]),
        Promise.resolve([]),
        Promise.resolve([]),
      ]
  }
}
