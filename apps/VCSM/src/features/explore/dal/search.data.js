// src/features/explore/dal/search.data.js

import { supabase } from '@/services/supabase/supabaseClient'
import { hydrateActorsByIds } from '@hydration'

// ============================================================
// Search Data — Unified Actor Directory
// ------------------------------------------------------------
// Uses identity.search_actor_directory RPC as single source.
// Privacy, block, and visibility filtering is server-side.
// No client-side privacy/block/bridge logic needed.
// ============================================================

/**
 * Map RPC filter tab to RPC p_filter value.
 */
function mapFilter(filter) {
  if (filter === 'users' || filter === 'vports') return filter
  return 'all'
}

/**
 * Normalize an RPC result row into the frontend actor shape.
 */
function normalizeActorRow(row) {
  if (!row || !row.actor_id) return null

  return {
    resultType: 'actor',
    result_type: 'actor', // legacy compat for ResultList/FeaturedResultCard
    actorDomain: row.actor_domain ?? 'vc',
    actorId: row.actor_id,
    actor_id: row.actor_id, // legacy compat
    actorKind: row.actor_kind ?? null,
    displayName: row.display_name ?? '',
    display_name: row.display_name ?? '', // legacy compat
    username: row.username ?? '',
    avatarUrl: row.avatar_url ?? '/avatar.jpg',
    photo_url: row.avatar_url ?? '/avatar.jpg', // legacy compat
    bannerUrl: row.banner_url ?? null,
    bio: row.bio ?? null,
    isPrivate: row.is_private === true,
    private: row.is_private === true, // legacy compat
    rank: row.rank ?? null,
  }
}

/**
 * Search actors (users + vports) via unified RPC.
 * Privacy, blocks, and visibility are enforced server-side.
 */
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
      console.warn('[search.data] search_actor_directory failed:', error.message)
    }
    throw error
  }

  const rows = (Array.isArray(data) ? data : [])
    .map(normalizeActorRow)
    .filter(Boolean)

  // Deduplicate by actorDomain + actorId
  const seen = new Set()
  const deduped = rows.filter((r) => {
    const key = `${r.actorDomain}:${r.actorId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Background hydration — populate actor store without blocking render
  const actorIds = deduped.map((r) => r.actorId).filter(Boolean)
  if (actorIds.length) {
    hydrateActorsByIds(actorIds).catch(() => {})
  }

  return deduped
}

export const search = {
  async users(rawQuery, opts = {}) {
    return searchActors(rawQuery, { ...opts, filter: 'users' })
  },

  async vports(rawQuery, opts = {}) {
    return searchActors(rawQuery, { ...opts, filter: 'vports' })
  },

  async actors(rawQuery, opts = {}) {
    return searchActors(rawQuery, { ...opts, filter: 'all' })
  },

  async posts() { return [] },
  async videos() { return [] },
  async groups() { return [] },
}

export default search
