import { useCallback, useState } from 'react'
import {
  ctrlAcceptFollowRequest,
  ctrlDeclineFollowRequest,
} from '@/features/social/friend/request/controllers/followRequests.controller'

export function usePendingFollowRequestActions({
  requesterActorId,
  targetActorId,
  onOptimisticHide,
  onRollbackHide,
}) {
  const [busy, setBusy] = useState(false)

  const accept = useCallback(async () => {
    if (busy) return
    setBusy(true)
    onOptimisticHide?.()

    try {
      await ctrlAcceptFollowRequest({ requesterActorId, targetActorId })
    } catch (error) {
      console.error('Accept failed', error)
      onRollbackHide?.()
      setBusy(false)
    }
  }, [busy, onOptimisticHide, onRollbackHide, requesterActorId, targetActorId])

  const decline = useCallback(async () => {
    if (busy) return
    setBusy(true)
    onOptimisticHide?.()

    try {
      await ctrlDeclineFollowRequest({ requesterActorId, targetActorId })
    } catch (error) {
      console.error('Decline failed', error)
      onRollbackHide?.()
      setBusy(false)
    }
  }, [busy, onOptimisticHide, onRollbackHide, requesterActorId, targetActorId])

  return { busy, accept, decline }
}
