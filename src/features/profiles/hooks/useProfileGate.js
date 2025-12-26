import { useEffect, useMemo, useState } from 'react'
import { dalGetActorPrivacy } from '@/features/social/privacy/dal/actorPrivacy.dal'
import { supabase } from '@/services/supabase/supabaseClient'

async function dalIsFollowing({ followerActorId, followedActorId }) {
  if (!followerActorId || !followedActorId) return false

  const { data, error } = await supabase
    .schema('vc')
    .from('actor_follows')
    .select('is_active')
    .eq('follower_actor_id', followerActorId)
    .eq('followed_actor_id', followedActorId)
    .maybeSingle()

  if (error) {
    console.error('[dalIsFollowing] error', error)
    return false
  }

  return Boolean(data?.is_active)
}
export function useProfileGate({
  viewerActorId,
  targetActorId,
  version = 0,
}) {
  const [loading, setLoading] = useState(true)
  const [isPrivate, setIsPrivate] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)

  const isSelf = useMemo(
    () =>
      Boolean(
        viewerActorId &&
        targetActorId &&
        viewerActorId === targetActorId
      ),
    [viewerActorId, targetActorId]
  )

  useEffect(() => {
    let mounted = true

    async function run() {
      // ⛔ Identity not ready yet — DO NOT force loading loop
      if (!viewerActorId || !targetActorId) {
        return
      }

      setLoading(true)

      try {
        // 🔑 Owner always allowed
        if (viewerActorId === targetActorId) {
          if (!mounted) return
          setIsPrivate(false)
          setIsFollowing(true)
          setLoading(false)
          return
        }

        const [{ isPrivate: priv }, following] = await Promise.all([
          dalGetActorPrivacy({ actorId: targetActorId }),
          dalIsFollowing({
            followerActorId: viewerActorId,
            followedActorId: targetActorId,
          }),
        ])

        if (!mounted) return
        setIsPrivate(Boolean(priv))
        setIsFollowing(Boolean(following))
        setLoading(false)
      } catch (err) {
        console.error('[useProfileGate] failed', err)
        if (mounted) setLoading(false)
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [viewerActorId, targetActorId, version])

  const canView = !isPrivate || isSelf || isFollowing

  return {
    loading,
    isPrivate,
    isFollowing,
    isSelf,
    canView,
  }
}
