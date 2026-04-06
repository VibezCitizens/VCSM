import { useCallback, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { useFollowRequestStatus } from '@/features/social/friend/request/hooks/useFollowRequestStatus'
import { useFollowStatus } from '@/features/social/friend/subscribe/hooks/useFollowStatus'
import { useUnsubscribeAction } from '@/features/social/friend/subscribe/hooks/useUnsubscribeAction'

import { ctrlSubscribe } from '@/features/social/friend/subscribe/controllers/follow.controller'
import { ctrlGetFollowRelationshipState } from '@/features/social/friend/subscribe/controllers/getFollowRelationshipState.controller'

import { useProfileGateStore } from '@/state/actors/profileGateStore'
import { useFollowRequestsStore } from '@/state/social/followRequestsStore'

const IS_DEV = import.meta.env.DEV

export function useSubscribeAction({
  viewerActorId,
  targetActorId,
  onAfterChange,
}) {
  const actionActorId = useMemo(() => viewerActorId ?? null, [viewerActorId])

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
  const [debugInfo, setDebugInfo] = useState(null)

  const effectiveRequestStatus = localRequestStatus ?? requestStatus
  const effectiveIsFollowing = localIsFollowing || isFollowing

  const unsubscribe = useUnsubscribeAction()

  const label = useMemo(() => {
    if (effectiveIsFollowing) return 'Unsubscribe'
    if (effectiveRequestStatus === 'pending') return 'Requested'
    return 'Subscribe'
  }, [effectiveIsFollowing, effectiveRequestStatus])

  const disabled =
    !actionActorId ||
    !targetActorId ||
    actionActorId === targetActorId ||
    effectiveRequestStatus === 'pending'

  const onClick = useCallback(async () => {
    if (disabled) {
      if (IS_DEV) {
        setDebugInfo({
          at: new Date().toISOString(),
          action: 'skip_disabled',
          actionActorId,
          targetActorId,
          effectiveIsFollowing,
          effectiveRequestStatus,
        })
      }
      return
    }

    let preflight = null

    if (IS_DEV) {
      try {
        preflight = await ctrlGetFollowRelationshipState({
          requesterActorId: actionActorId,
          targetActorId,
        })
      } catch (preflightError) {
        preflight = {
          error: preflightError?.message ?? 'preflight_failed',
          code: preflightError?.code ?? null,
        }
      }
    }

    try {
      if (effectiveIsFollowing) {
        await unsubscribe({
          followerActorId: actionActorId,
          followedActorId: targetActorId,
        })

        setLocalIsFollowing(false)
        setLocalRequestStatus(null)

        useProfileGateStore.getState().invalidateGate()

        if (IS_DEV) {
          setDebugInfo({
            at: new Date().toISOString(),
            action: 'unsubscribe',
            actionActorId,
            targetActorId,
            preflight,
            result: {
              status: 'not_following',
            },
          })
        }

        onAfterChange?.()
        return
      }

      const result = await ctrlSubscribe({
        followerActorId: actionActorId,
        followedActorId: targetActorId,
      })

      if (result?.status === 'pending') {
        setLocalIsFollowing(false)
        setLocalRequestStatus('pending')
        useFollowRequestsStore.getState().invalidate()
        toast.success('Follow request sent for approval.')
      } else {
        setLocalIsFollowing(true)
        setLocalRequestStatus(null)
      }

      if (IS_DEV) {
        setDebugInfo({
          at: new Date().toISOString(),
          action: 'subscribe',
          actionActorId,
          targetActorId,
          preflight,
          result: {
            mode: result?.mode ?? null,
            status: result?.status ?? null,
            isFollowing: Boolean(result?.isFollowing),
            decision: result?.decision ?? null,
          },
        })
      }

      onAfterChange?.()
    } catch (error) {
      const permissionDenied = error?.code === '42501'

      if (IS_DEV) {
        setDebugInfo({
          at: new Date().toISOString(),
          action: effectiveIsFollowing ? 'unsubscribe' : 'subscribe',
          actionActorId,
          targetActorId,
          preflight,
          error: {
            code: error?.code ?? null,
            message: error?.message ?? null,
            details: error?.details ?? null,
            hint: error?.hint ?? null,
            expectedFollowPermissionDenied:
              error?.expectedFollowPermissionDenied === true,
            followDecision: error?.followDecision ?? null,
          },
        })
      }

      console.error('[useSubscribeAction] follow action failed', {
        actionActorId,
        viewerActorId,
        targetActorId,
        message: error?.message ?? null,
        code: error?.code ?? null,
        details: error?.details ?? null,
        hint: error?.hint ?? null,
        error,
      })

      toast.error(
        permissionDenied
          ? 'Follow permission denied for the current actor.'
          : (error?.message ?? 'Failed to update subscription')
      )
    }
  }, [
    actionActorId,
    viewerActorId,
    targetActorId,
    effectiveIsFollowing,
    effectiveRequestStatus,
    disabled,
    unsubscribe,
    onAfterChange,
  ])

  return {
    label,
    disabled,
    onClick,
    isSubscribed: effectiveIsFollowing,
    debugInfo: IS_DEV ? debugInfo : null,
  }
}
