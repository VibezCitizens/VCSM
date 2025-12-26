import { useEffect, useState } from 'react'
import { supabase } from '@/services/supabase/supabaseClient'

/**
 * ============================================================
 * useFollowStatus (ACTOR SSOT)
 * ------------------------------------------------------------
 * Source of truth:
 * - vc.actor_follows
 *
 * Meaning:
 * - true  → active follow exists
 * - false → no follow or inactive
 *
 * Notes:
 * - read-only hook
 * - no side effects
 * ============================================================
 */
export function useFollowStatus({
  followerActorId,
  followedActorId,
}) {
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    let alive = true

    // Guard INSIDE effect (deps stay stable)
    if (!followerActorId || !followedActorId) {
      setIsFollowing(false)
      return
    }

    async function load() {
      const { data, error } = await supabase
        .schema('vc')
        .from('actor_follows')
        .select('is_active')
        .eq('follower_actor_id', followerActorId)
        .eq('followed_actor_id', followedActorId)
        .maybeSingle()

      if (!alive) return

      if (error) {
        console.error('[useFollowStatus] error', error)
        setIsFollowing(false)
        return
      }

      setIsFollowing(Boolean(data?.is_active))
    }

    load()

    return () => {
      alive = false
    }
  }, [followerActorId, followedActorId])

  return isFollowing
}
