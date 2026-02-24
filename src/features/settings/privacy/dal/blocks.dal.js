// src/features/settings/privacy/dal/blocks.dal.js
// ============================================================
// Blocks DAL (LOCKED)
// - raw rows only
// - explicit projections
// - no business meaning
// - vc schema
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'
import { toContainsPattern } from '@/services/supabase/postgrestSafe'

/**
 * DAL Contract:
 * - raw rows only
 * - explicit projections
 * - no business meaning
 */

const BLOCKS_TABLE = 'user_blocks' // ✅ FIX: no schema prefix
const ACTOR_VIEW = 'actor_presentation'

// --------------------------------------------------
// BLOCKS
// --------------------------------------------------

export async function dalListMyBlocks({ actorId }) {
  if (!actorId) {
    throw new Error('dalListMyBlocks: actorId required')
  }

  const { data, error } = await supabase
    .schema('vc')
    .from(BLOCKS_TABLE)
    .select('id, blocker_actor_id, blocked_actor_id, created_at, reason')
    .eq('blocker_actor_id', actorId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function dalInsertBlock({ actorId, blockedActorId }) {
  if (!actorId || !blockedActorId) {
    throw new Error('dalInsertBlock: actorId and blockedActorId required')
  }

  const { data, error } = await supabase
    .schema('vc')
    .from(BLOCKS_TABLE)
    .insert({
      blocker_actor_id: actorId,
      blocked_actor_id: blockedActorId,
    })
    .select('id, blocker_actor_id, blocked_actor_id, created_at, reason')
    .single()

  if (error) throw error
  return data
}

export async function dalDeleteBlockByTarget({ actorId, blockedActorId }) {
  if (!actorId || !blockedActorId) {
    throw new Error('dalDeleteBlockByTarget: actorId and blockedActorId required')
  }

  const { error } = await supabase
    .schema('vc')
    .from(BLOCKS_TABLE)
    .delete()
    .eq('blocker_actor_id', actorId)
    .eq('blocked_actor_id', blockedActorId)

  if (error) throw error
  return true
}

// --------------------------------------------------
// ACTOR LOOKUP (READ-ONLY)
// --------------------------------------------------

export async function dalSearchActors({ query, limit = 12 }) {
  const pattern = toContainsPattern(query)
  if (!pattern) return []

  const { data, error } = await supabase
    .from(ACTOR_VIEW) // 👈 view is already exposed correctly
    .select(
      'actor_id, kind, display_name, username, photo_url, vport_name, vport_slug, vport_avatar_url'
    )
    .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
    .limit(limit)

  if (error) throw error
  return data || []
}
