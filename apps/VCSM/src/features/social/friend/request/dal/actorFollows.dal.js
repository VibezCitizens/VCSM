import { supabase } from '@/services/supabase/supabaseClient'
import { createTTLCache } from '@/shared/lib/ttlCache'

/**
 * ============================================================
 * DAL — Actor Follows
 * ------------------------------------------------------------
 * Source of truth: vc.actor_follows
 * This DAL ONLY mutates accepted follow edges
 * ============================================================
 */

// 8s TTL — prevents repeated DB hits during rapid UI interactions.
const followStatusCache = createTTLCache(8_000)

function followStatusKey(followerActorId, followedActorId) {
  return `${followerActorId}:${followedActorId}`
}

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
    const message = String(error?.message ?? '')
    const expectedActorPermission =
      error?.code === '42501' && /not allowed for actor/i.test(message)

    if (expectedActorPermission) {
      error.expectedFollowPermissionDenied = true
      throw error
    }

    console.error('[dalInsertFollow] error', {
      followerActorId,
      followedActorId,
      message: error?.message ?? null,
      code: error?.code ?? null,
      details: error?.details ?? null,
      hint: error?.hint ?? null,
      error,
    })
    throw error
  }

  followStatusCache.invalidate(followStatusKey(followerActorId, followedActorId))
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

  followStatusCache.invalidate(followStatusKey(followerActorId, followedActorId))
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

  const key = followStatusKey(followerActorId, followedActorId)
  if (followStatusCache.has(key)) return followStatusCache.get(key)

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

  const result = Boolean(data?.is_active)
  followStatusCache.set(key, result)
  return result
}
