import { useCallback, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { useSendFollowRequest } from '@/features/social/friend/request/hooks/useSendFollowRequest'
import { useFollowRequestStatus } from '@/features/social/friend/request/hooks/useFollowRequestStatus'
import { useFollowStatus } from '@/features/social/friend/subscribe/hooks/useFollowStatus'
import { useUnsubscribeAction } from '@/features/social/friend/subscribe/hooks/useUnsubscribeAction'

import { ctrlSubscribe } from '@/features/social/friend/subscribe/controllers/follow.controller'

import { useProfileGateStore } from '@/state/actors/profileGateStore'
import { useFollowRequestsStore } from '@/state/social/followRequestsStore'
import { useIdentity } from '@/state/identity/identityContext'

export function useSubscribeAction({
  viewerActorId,
  targetActorId,
  profileIsPrivate,
  onAfterChange,
}) {
  const { identity } = useIdentity()

  const actionActorId = useMemo(() => {
    if (!viewerActorId) return null

    const isCurrentIdentity =
      identity?.actorId && String(identity.actorId) === String(viewerActorId)

    // Follow actions are owned by the user actor in current DB policy.
    if (isCurrentIdentity && identity?.kind === 'vport') {
      return identity?.ownerActorId ?? null
    }

    return viewerActorId
  }, [viewerActorId, identity?.actorId, identity?.kind, identity?.ownerActorId])

  const needsOwnerActor =
    Boolean(viewerActorId) &&
    identity?.actorId === viewerActorId &&
    identity?.kind === 'vport' &&
    !actionActorId

  const isFollowing = useFollowStatus({
    followerActorId: actionActorId,
    followedActorId: targetActorId,
  })

  const requestStatus = useFollowRequestStatus({
    requesterActorId: actionActorId,
    targetActorId,
  })

  const [localRequestStatus, setLocalRequestStatus] = useState(null)
  const [localIsFollowing, setLocalIsFollowing] = useState(false)

  const effectiveRequestStatus = localRequestStatus ?? requestStatus
  const effectiveIsFollowing = localIsFollowing || isFollowing

  const sendRequest = useSendFollowRequest()
  const unsubscribe = useUnsubscribeAction()

  const label = useMemo(() => {
    if (needsOwnerActor) return 'Switch Actor'
    if (effectiveIsFollowing) return 'Unsubscribe'
    if (effectiveRequestStatus === 'pending') return 'Pending'
    return 'Subscribe'
  }, [needsOwnerActor, effectiveIsFollowing, effectiveRequestStatus])

  const disabled =
    !actionActorId ||
    !targetActorId ||
    actionActorId === targetActorId ||
    effectiveRequestStatus === 'pending'

  const onClick = useCallback(async () => {
    if (disabled) return

    try {
      if (effectiveIsFollowing) {
        await unsubscribe({
          followerActorId: actionActorId,
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
          requesterActorId: actionActorId,
          targetActorId,
        })

        setLocalRequestStatus('pending')
        useFollowRequestsStore.getState().invalidate()

        onAfterChange?.()
        return
      }

      await ctrlSubscribe({
        followerActorId: actionActorId,
        followedActorId: targetActorId,
      })

      setLocalIsFollowing(true)
      setLocalRequestStatus(null)

      onAfterChange?.()
    } catch (error) {
      const message = String(error?.message ?? '')
      const permissionDenied = error?.code === '42501'
      const followInsertDenied =
        permissionDenied &&
        /not allowed for actor/i.test(message) &&
        !profileIsPrivate

      if (followInsertDenied) {
        try {
          await sendRequest({
            requesterActorId: actionActorId,
            targetActorId,
          })

          setLocalRequestStatus('pending')
          useFollowRequestsStore.getState().invalidate()
          toast.success('Follow request sent for approval.')
          onAfterChange?.()
          return
        } catch (fallbackError) {
          console.error('[useSubscribeAction] follow fallback->request failed', {
            actionActorId,
            targetActorId,
            message: fallbackError?.message ?? null,
            code: fallbackError?.code ?? null,
            details: fallbackError?.details ?? null,
            hint: fallbackError?.hint ?? null,
            error: fallbackError,
          })
        }
      }

      console.error('[useSubscribeAction] follow action failed', {
        actionActorId,
        viewerActorId,
        targetActorId,
        identityKind: identity?.kind ?? null,
        ownerActorId: identity?.ownerActorId ?? null,
        message: error?.message ?? null,
        code: error?.code ?? null,
        details: error?.details ?? null,
        hint: error?.hint ?? null,
        error,
      })

      toast.error(
        permissionDenied
          ? 'Follow permission denied for the current actor. Switch to your citizen actor and try again.'
          : (error?.message ?? 'Failed to update subscription')
      )
    }
  }, [
    actionActorId,
    viewerActorId,
    targetActorId,
    profileIsPrivate,
    effectiveIsFollowing,
    disabled,
    sendRequest,
    unsubscribe,
    onAfterChange,
    identity?.kind,
    identity?.ownerActorId,
  ])

  return {
    label,
    disabled,
    onClick,
    isSubscribed: effectiveIsFollowing,
  }
}
