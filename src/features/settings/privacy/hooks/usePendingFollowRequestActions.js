import { useCallback, useState } from 'react'
import {
  ctrlAcceptFollowRequest,
  ctrlDeclineFollowRequest,
} from '@/features/social/adapters/friend/request/controllers/followRequests.controller.adapter'
import { useFollowRequestsStore } from '@/state/social/followRequestsStore'

export function usePendingFollowRequestActions({
  requesterActorId,
  targetActorId,
  onOptimisticHide,
  onRollbackHide,
}) {
  const [busy, setBusy] = useState(false)
  const invalidate = useFollowRequestsStore((s) => s.invalidate)

  const accept = useCallback(async () => {
    if (busy) return
    setBusy(true)
    onOptimisticHide?.()

    try {
      await ctrlAcceptFollowRequest({ requesterActorId, targetActorId })
      invalidate()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('noti:reload'))
        window.dispatchEvent(new Event('noti:refresh'))
      }
    } catch (error) {
      console.error('Accept failed', error)
      onRollbackHide?.()
    } finally {
      setBusy(false)
    }
  }, [busy, invalidate, onOptimisticHide, onRollbackHide, requesterActorId, targetActorId])

  const decline = useCallback(async () => {
    if (busy) return
    setBusy(true)
    onOptimisticHide?.()

    try {
      await ctrlDeclineFollowRequest({ requesterActorId, targetActorId })
      invalidate()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('noti:reload'))
        window.dispatchEvent(new Event('noti:refresh'))
      }
    } catch (error) {
      console.error('Decline failed', error)
      onRollbackHide?.()
    } finally {
      setBusy(false)
    }
  }, [busy, invalidate, onOptimisticHide, onRollbackHide, requesterActorId, targetActorId])

  return { busy, accept, decline }
}
