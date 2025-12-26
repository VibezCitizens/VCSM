// src/features/profiles/dal/readActorPosts.dal.js
// ============================================================
// READ ACTOR POSTS (PROFILE CONTEXT)
// ------------------------------------------------------------
// - RAW POSTS ONLY (NO EMBEDS)
// - Actor-based (actor_id only)
// - Matches CentralFeed DAL behavior
// - NEVER touches actor_presentation
// - Safe: posts failure must NOT break profile
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Returns RAW post rows for a single actor
 * Presentation is resolved later via hydrateActorsFromRows + useActorPresentation
 */
export async function readActorPostsDAL(actorId) {
  if (!actorId) return []

  const { data, error } = await supabase
    .schema('vc')
    .from('posts')
    .select(`
      id,
      actor_id,
      text,
      title,
      media_type,
      media_url,
      post_type,
      tags,
      created_at
    `)
    .eq('actor_id', actorId)
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('[readActorPostsDAL] failed (non-fatal)', error)
    return [] // 🔒 CRITICAL: NEVER throw
  }

  return Array.isArray(data) ? data : []
}
