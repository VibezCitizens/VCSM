import { supabase } from '@/services/supabase/supabaseClient'

/**
 * ============================================================
 * DAL — Actor Follows
 * ------------------------------------------------------------
 * Source of truth: vc.actor_follows
 * This DAL ONLY mutates accepted follow edges
 * ============================================================
 */

/**
 * Insert or reactivate a follow edge
 * Idempotent by PK (follower_actor_id, followed_actor_id)
 */
export async function dalInsertFollow({
  followerActorId,
  followedActorId,
}) {
  if (!followerActorId || !followedActorId) {
    throw new Error('Missing actor ids')
  }

  const { error } = await supabase
  .schema ('vc')
    .from('actor_follows')
    .upsert(
      {
        follower_actor_id: followerActorId,
        followed_actor_id: followedActorId,
        is_active: true,
      },
      {
        onConflict: 'follower_actor_id,followed_actor_id',
      }
    )

  if (error) {
    console.error('[dalInsertFollow] error', error)
    throw error
  }

  return true
}

/**
 * Deactivate (unfollow) without deleting history
 */
export async function dalDeactivateFollow({
  followerActorId,
  followedActorId,
}) {
  if (!followerActorId || !followedActorId) {
    throw new Error('Missing actor ids')
  }

  const { error } = await supabase
  .schema ('vc')
    .from('actor_follows')
    .update({ is_active: false })
    .eq('follower_actor_id', followerActorId)
    .eq('followed_actor_id', followedActorId)

  if (error) {
    console.error('[dalDeactivateFollow] error', error)
    throw error
  }

  return true
}

/**
 * Read follow edge (SSOT)
 */
export async function dalGetFollowStatus({
  followerActorId,
  followedActorId,
}) {
  if (!followerActorId || !followedActorId) {
    return false
  }

  const { data, error } = await supabase
  .schema ('vc')
    .from('actor_follows')
    .select('is_active')
    .eq('follower_actor_id', followerActorId)
    .eq('followed_actor_id', followedActorId)
    .maybeSingle()

  if (error) {
    console.error('[dalGetFollowStatus] error', error)
    return false
  }

  return Boolean(data?.is_active)
}
