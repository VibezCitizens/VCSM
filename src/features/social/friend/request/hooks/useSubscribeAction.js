import { useCallback, useMemo, useState } from 'react'

import { useSendFollowRequest } from '@/features/social/friend/request/hooks/useSendFollowRequest'
import { useFollowRequestStatus } from '@/features/social/friend/request/hooks/useFollowRequestStatus'
import { useFollowStatus } from '@/features/social/friend/subscribe/hooks/useFollowStatus'
import { useUnsubscribeAction } from '@/features/social/friend/subscribe/hooks/useUnsubscribeAction'

import { ctrlSubscribe } from '@/features/social/friend/subscribe/controllers/follow.controller'

import { useProfileGateStore } from '@/state/actors/profileGateStore'
import { useFollowRequestsStore } from '@/state/social/followRequestsStore'

export function useSubscribeAction({
  viewerActorId,
  targetActorId,
  profileIsPrivate,
  onAfterChange,
}) {
  const isFollowing = useFollowStatus({
    followerActorId: viewerActorId,
    followedActorId: targetActorId,
  })

  const requestStatus = useFollowRequestStatus({
    requesterActorId: viewerActorId,
    targetActorId,
  })

  const [localRequestStatus, setLocalRequestStatus] = useState(null)
  const [localIsFollowing, setLocalIsFollowing] = useState(false)

  const effectiveRequestStatus = localRequestStatus ?? requestStatus
  const effectiveIsFollowing = localIsFollowing || isFollowing

  const sendRequest = useSendFollowRequest()
  const unsubscribe = useUnsubscribeAction()

  const label = useMemo(() => {
    if (effectiveIsFollowing) return 'Unsubscribe'
    if (profileIsPrivate && effectiveRequestStatus === 'pending') return 'Pending'
    return 'Subscribe'
  }, [effectiveIsFollowing, profileIsPrivate, effectiveRequestStatus])

  const disabled =
    !viewerActorId ||
    !targetActorId ||
    viewerActorId === targetActorId ||
    effectiveRequestStatus === 'pending'

  const onClick = useCallback(async () => {
    if (disabled) return

    if (effectiveIsFollowing) {
      await unsubscribe({
        followerActorId: viewerActorId,
        followedActorId: targetActorId,
      })

      setLocalIsFollowing(false)
      setLocalRequestStatus(null)

      useProfileGateStore.getState().invalidateGate()

      onAfterChange?.()
      return
    }

    if (profileIsPrivate) {
      await sendRequest({
        requesterActorId: viewerActorId,
        targetActorId,
      })

      setLocalRequestStatus('pending')
      useFollowRequestsStore.getState().invalidate()

      onAfterChange?.()
      return
    }

    await ctrlSubscribe({
      followerActorId: viewerActorId,
      followedActorId: targetActorId,
    })

    setLocalIsFollowing(true)
    setLocalRequestStatus(null)

    onAfterChange?.()
  }, [
    viewerActorId,
    targetActorId,
    profileIsPrivate,
    effectiveIsFollowing,
    disabled,
    sendRequest,
    unsubscribe,
    onAfterChange,
  ])

  return {
    label,
    disabled,
    onClick,
    isSubscribed: effectiveIsFollowing,
  }
}
