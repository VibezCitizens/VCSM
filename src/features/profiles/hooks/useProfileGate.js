import { useCallback, useEffect, useMemo, useState } from 'react'
import { ctrlGetActorPrivacy } from '@/features/social/adapters/privacy/controllers/getActorPrivacy.controller.adapter'
import { ctrlGetFollowStatus } from '@/features/social/adapters/friend/subscribe/controllers/getFollowStatus.controller.adapter'
import { ctrlSendFollowRequest } from '@/features/social/adapters/friend/request/controllers/followRequests.controller.adapter'
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
          ctrlGetActorPrivacy({ actorId: targetActorId }),
          ctrlGetFollowStatus({
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

  const requestFollow = useCallback(async () => {
    if (!viewerActorId || !targetActorId) return false
    if (viewerActorId === targetActorId) return false

    try {
      await ctrlSendFollowRequest({
        requesterActorId: viewerActorId,
        targetActorId,
      })
      return true
    } catch (err) {
      console.error('[useProfileGate.requestFollow] failed', err)
      return false
    }
  }, [viewerActorId, targetActorId])

  return {
    loading,
    isPrivate,
    isFollowing,
    isSelf,
    canView,
    requestFollow,
  }
}
