// src/features/settings/privacy/dal/blocks.dal.js
// ============================================================
// Blocks DAL (Settings/Privacy)
// - raw rows only
// - explicit projections
// - moderation schema for blocks
// - vc schema for actor lookups
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'
import { toContainsPattern } from '@/services/supabase/postgrestSafe'

const BLOCK_COLUMNS = 'blocker_domain,blocker_actor_id,blocked_domain,blocked_actor_id,status,reason,released_at,meta,created_at,updated_at'

// --------------------------------------------------
// BLOCKS (moderation.blocks)
// --------------------------------------------------

export async function dalListMyBlocks({ actorId }) {
  if (!actorId) {
    throw new Error('dalListMyBlocks: actorId required')
  }

  const { data, error } = await supabase
    .schema('moderation')
    .from('blocks')
    .select(BLOCK_COLUMNS)
    .eq('blocker_actor_id', actorId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function dalInsertBlock({ actorId, blockedActorId }) {
  if (!actorId || !blockedActorId) {
    throw new Error('dalInsertBlock: actorId and blockedActorId required')
  }

  const { error } = await supabase
    .schema('moderation')
    .rpc('block_actor', {
      p_blocker_actor_id: actorId,
      p_blocked_actor_id: blockedActorId,
    })

  if (error) throw error
  return { blocker_actor_id: actorId, blocked_actor_id: blockedActorId, status: 'active' }
}

export async function dalDeleteBlockByTarget({ actorId, blockedActorId }) {
  if (!actorId || !blockedActorId) {
    throw new Error('dalDeleteBlockByTarget: actorId and blockedActorId required')
  }

  const { error } = await supabase
    .schema('moderation')
    .rpc('unblock_actor', {
      p_blocker_actor_id: actorId,
      p_blocked_actor_id: blockedActorId,
    })

  if (error) throw error
  return true
}

export async function dalReadActorKindAndVportId(actorId) {
  if (!actorId) {
    throw new Error('dalReadActorKindAndVportId: actorId required')
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('actors')
    .select('kind, vport_id')
    .eq('id', actorId)
    .maybeSingle()

  if (error) throw error
  return data || null
}

// --------------------------------------------------
// ACTOR LOOKUP (READ-ONLY, vc schema)
// --------------------------------------------------

export async function dalSearchActors({ query, limit = 12, viewerActorId = null }) {
  const needle = (query || '').replace(/^[@#]/, '').trim()
  if (!needle) return []

  const { data, error } = await supabase
    .schema('identity')
    .rpc('search_actor_directory', {
      p_viewer_domain: 'vc',
      p_viewer_actor_id: viewerActorId,
      p_query: needle,
      p_filter: 'all',
      p_limit: limit,
      p_offset: 0,
    })

  if (error) throw error

  return (Array.isArray(data) ? data : []).map((row) => ({
    actor_id:         row.actor_id,
    kind:             row.actor_kind ?? null,
    display_name:     row.display_name ?? null,
    username:         row.username ?? null,
    photo_url:        row.avatar_url ?? null,
    vport_name:       row.actor_kind === 'vport' ? row.display_name ?? null : null,
    vport_slug:       row.actor_kind === 'vport' ? row.username ?? null : null,
    vport_avatar_url: row.actor_kind === 'vport' ? row.avatar_url ?? null : null,
  }))
}
