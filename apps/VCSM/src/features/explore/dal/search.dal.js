import { supabase } from '@/services/supabase/supabaseClient'
import { hydrateActorsByIds } from '@hydration'
import { normalizeActorRow } from '@/features/explore/model/search.model'

const DEV = import.meta.env?.DEV

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

async function searchPosts(rawQuery, opts = {}) {
  const { limit = 25, offset = 0 } = opts

  const q = (rawQuery || '').trim()
  if (!q) return []

  const normalizedTag = (q.startsWith('#') ? q.slice(1) : q).toLowerCase().trim()
  if (!normalizedTag) return []

  if (DEV) console.log('[explore:search:posts:start]', { q, normalizedTag })

  const makeBase = () =>
    supabase
      .schema('vc')
      .from('posts')
      .select('id, actor_id, text, title, tags, created_at')
      .is('deleted_at', null)
      .or('is_hidden.is.null,is_hidden.eq.false')
      .not('tags', 'is', null)
      .not('tags', 'eq', '{}')

  const [byText, byTag] = await Promise.all([
    makeBase().ilike('text', `%${q}%`).order('created_at', { ascending: false }).limit(limit),
    makeBase().contains('tags', [normalizedTag]).order('created_at', { ascending: false }).limit(limit),
  ])

  if (byText.error && DEV) console.warn('[explore:search:posts:error:text]', byText.error.message)
  if (byTag.error && DEV) console.warn('[explore:search:posts:error:tag]', byTag.error.message)

  const seen = new Map()
  for (const r of [...(byText.data ?? []), ...(byTag.data ?? [])]) {
    if (!seen.has(r.id)) seen.set(r.id, r)
  }

  const results = [...seen.values()].map((p) => ({
    result_type: 'post',
    id: p.id,
    actor_id: p.actor_id,
    text: p.text,
    title: p.title,
    tags: p.tags,
    created_at: p.created_at,
  }))

  if (DEV) {
    console.log(`[explore:search:posts:result] found=${results.length}`, { normalizedTag })
    if (!results.length) console.log('[explore:search:posts:empty]', { q })
  }

  return results
}

async function searchPostsByTag(tag, opts = {}) {
  const { limit = 25, offset = 0 } = opts

  const normalizedTag = (tag || '').toLowerCase().trim()
  if (!normalizedTag) return []

  if (DEV) console.log('[explore:search:posts:tag-only]', { normalizedTag })

  const { data, error } = await supabase
    .schema('vc')
    .from('posts')
    .select('id, actor_id, text, title, tags, created_at')
    .is('deleted_at', null)
    .or('is_hidden.is.null,is_hidden.eq.false')
    .contains('tags', [normalizedTag])
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (DEV) console.warn('[explore:search:posts:tag-only:error]', error.message)
    throw error
  }

  const results = (Array.isArray(data) ? data : []).map((p) => ({
    result_type: 'post',
    id: p.id,
    actor_id: p.actor_id,
    text: p.text,
    title: p.title,
    tags: p.tags,
    created_at: p.created_at,
  }))

  if (DEV) {
    console.log(`[explore:search:posts:tag-only:result] found=${results.length}`, { normalizedTag })
    if (!results.length) console.log('[explore:search:posts:tag-only:empty]', { tag })
  }

  return results
}

export function searchDal(query, filter, opts = {}) {
  const rawQ = (query || '').trim()

  // Hashtag mode: # prefix → tag-only post search, ignore filter tab
  if (rawQ.startsWith('#')) {
    const tag = rawQ.slice(1).toLowerCase().trim()
    return tag ? [searchPostsByTag(tag, opts)] : [Promise.resolve([])]
  }

  switch (filter) {
    case 'users':
      return [searchActors(query, { ...opts, filter: 'users' })]
    case 'vports':
      return [searchActors(query, { ...opts, filter: 'vports' })]
    case 'posts':
      return [searchPosts(query, opts)]
    case 'videos':
      return [Promise.resolve([])]
    case 'groups':
      return [Promise.resolve([])]
    case 'all':
    default:
      return [
        searchActors(query, { ...opts, filter: 'all' }),
        searchPosts(query, opts),
        Promise.resolve([]),
        Promise.resolve([]),
      ]
  }
}
