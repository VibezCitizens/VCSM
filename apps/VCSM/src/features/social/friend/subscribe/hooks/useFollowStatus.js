import { useEffect, useState } from 'react'
import { ctrlGetFollowStatus } from '@/features/social/friend/subscribe/controllers/getFollowStatus.controller'

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
      try {
        const following = await ctrlGetFollowStatus({
          followerActorId,
          followedActorId,
        })
        if (!alive) return
        setIsFollowing(Boolean(following))
      } catch (error) {
        if (!alive) return
        console.error('[useFollowStatus] error', error)
        setIsFollowing(false)
      }
    }

    load()

    return () => {
      alive = false
    }
  }, [followerActorId, followedActorId])

  return isFollowing
}
