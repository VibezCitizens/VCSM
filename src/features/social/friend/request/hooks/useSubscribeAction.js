import { useCallback, useMemo, useState } from 'react'

import { useSendFollowRequest } from '@/features/social/friend/request/hooks/useSendFollowRequest'
import { useFollowRequestStatus } from '@/features/social/friend/request/hooks/useFollowRequestStatus'
import { useFollowStatus } from '@/features/social/friend/subscribe/hooks/useFollowStatus'
import { useUnsubscribeAction } from '@/features/social/friend/subscribe/hooks/useUnsubscribeAction'

import { ctrlSubscribe } from '@/features/social/friend/subscribe/controllers/follow.controller'

import { useProfileGateStore } from "@/state/actors/profileGateStore";

import { useFollowRequestsStore } from '@/state/social/followRequestsStore'

export function useSubscribeAction({
  viewerActorId,
  targetActorId,
  profileIsPrivate,
  onAfterChange,
}) {
  // ============================================================
  // FOLLOW STATE (DB SSOT)
  // ============================================================
  const isFollowing = useFollowStatus({
    followerActorId: viewerActorId,
    followedActorId: targetActorId,
  })

  const requestStatus = useFollowRequestStatus({
    requesterActorId: viewerActorId,
    targetActorId,
  })

  // ============================================================
  // LOCAL OPTIMISTIC STATE (UI)
  // ============================================================
  const [localRequestStatus, setLocalRequestStatus] = useState(null)
  const [localIsFollowing, setLocalIsFollowing] = useState(false)

  const effectiveRequestStatus = localRequestStatus ?? requestStatus
  const effectiveIsFollowing = localIsFollowing || isFollowing

  // ============================================================
  // ACTION HOOKS
  // ============================================================
  const sendRequest = useSendFollowRequest()
  const unsubscribe = useUnsubscribeAction()

  // ============================================================
  // LABEL
  // ============================================================
  const label = useMemo(() => {
    console.debug('[useSubscribeAction] label compute', {
      viewerActorId,
      targetActorId,
      isFollowing,
      localIsFollowing,
      effectiveIsFollowing,
      profileIsPrivate,
      requestStatus,
      localRequestStatus,
      effectiveRequestStatus,
    })

    if (effectiveIsFollowing) return 'Unsubscribe'
    if (profileIsPrivate && effectiveRequestStatus === 'pending') return 'Pending'
    return 'Subscribe'
  }, [
    viewerActorId,
    targetActorId,
    isFollowing,
    localIsFollowing,
    effectiveIsFollowing,
    profileIsPrivate,
    effectiveRequestStatus,
  ])

  // ============================================================
  // DISABLED
  // ============================================================
  const disabled =
    !viewerActorId ||
    !targetActorId ||
    viewerActorId === targetActorId ||
    effectiveRequestStatus === 'pending'

  // ============================================================
  // CLICK HANDLER
  // ============================================================
  const onClick = useCallback(async () => {
    console.groupCollapsed(
      '%c[useSubscribeAction] onClick',
      'color:#2563eb;font-weight:bold;'
    )

    console.table({
      viewerActorId,
      targetActorId,
      profileIsPrivate,
      isFollowing,
      localIsFollowing,
      effectiveIsFollowing,
      requestStatus,
      localRequestStatus,
      effectiveRequestStatus,
      disabled,
    })

    console.trace('call stack')

    if (disabled) {
      console.warn('⛔ blocked: disabled === true')
      console.groupEnd()
      return
    }

    try {
      // ========================================================
      // 1️⃣ ALREADY FOLLOWING → UNSUBSCRIBE
      // ========================================================
     if (effectiveIsFollowing) {
  console.log('➡️ branch: unsubscribe')

  await unsubscribe({
    followerActorId: viewerActorId,
    followedActorId: targetActorId,
  })

  setLocalIsFollowing(false)
  setLocalRequestStatus(null)

  // 🔥 FORCE PROFILE PRIVACY RE-GATE
  useProfileGateStore.getState().invalidateGate()

  console.log('✅ unsubscribe completed')
  onAfterChange?.()
  console.groupEnd()
  return
}

    // ========================================================
// 2️⃣ PRIVATE PROFILE → SEND FOLLOW REQUEST
// ========================================================
if (profileIsPrivate) {
  console.log('➡️ branch: private → send follow request')

  await sendRequest({
    requesterActorId: viewerActorId,
    targetActorId,
  })

  setLocalRequestStatus('pending')

  // 🔥 THIS IS THE MISSING LINE
  useFollowRequestsStore.getState().invalidate()

  console.log('✅ follow request sent (optimistic pending)')
  onAfterChange?.()
  console.groupEnd()
  return
}

      // ========================================================
      // 3️⃣ PUBLIC PROFILE → FOLLOW IMMEDIATELY
      // ========================================================
      console.log('➡️ branch: public → follow immediately')

      await ctrlSubscribe({
        followerActorId: viewerActorId,
        followedActorId: targetActorId,
      })

      // 🔥 OPTIMISTIC FOLLOW
      setLocalIsFollowing(true)
      setLocalRequestStatus(null)

      console.log('✅ public follow completed')
      onAfterChange?.()
      console.groupEnd()
      return
    } catch (err) {
      console.error('❌ error in useSubscribeAction', err)
      console.groupEnd()
      throw err
    }
  }, [
    viewerActorId,
    targetActorId,
    profileIsPrivate,
    isFollowing,
    localIsFollowing,
    effectiveIsFollowing,
    requestStatus,
    localRequestStatus,
    effectiveRequestStatus,
    disabled,
    sendRequest,
    unsubscribe,
    onAfterChange,
  ])

  // ============================================================
  // EXPORT
  // ============================================================
  return {
    label,
    disabled,
    onClick,
    isSubscribed: effectiveIsFollowing,
  }
}
