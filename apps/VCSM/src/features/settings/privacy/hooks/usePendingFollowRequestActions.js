import { useCallback, useState } from 'react'
import { useFollowRequestActions } from '@/features/social/adapters/friend/request/hooks/useFollowRequestActions.adapter'
import { useFollowRequestsStore } from '@/state/social/followRequestsStore'

export function usePendingFollowRequestActions({
  requesterActorId,
  targetActorId,
  onOptimisticHide,
  onRollbackHide,
}) {
  const { acceptRequest, declineRequest } = useFollowRequestActions()
  const [busy, setBusy] = useState(false)
  const invalidate = useFollowRequestsStore((s) => s.invalidate)

  const accept = useCallback(async () => {
    if (busy) return
    setBusy(true)
    onOptimisticHide?.()

    try {
      await acceptRequest({ requesterActorId, targetActorId })
      invalidate()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('noti:reload'))
        window.dispatchEvent(new Event('noti:refresh'))
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Accept failed', error)
      onRollbackHide?.()
    } finally {
      setBusy(false)
    }
  }, [acceptRequest, busy, invalidate, onOptimisticHide, onRollbackHide, requesterActorId, targetActorId])

  const decline = useCallback(async () => {
    if (busy) return
    setBusy(true)
    onOptimisticHide?.()

    try {
      await declineRequest({ requesterActorId, targetActorId })
      invalidate()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('noti:reload'))
        window.dispatchEvent(new Event('noti:refresh'))
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Decline failed', error)
      onRollbackHide?.()
    } finally {
      setBusy(false)
    }
  }, [busy, declineRequest, invalidate, onOptimisticHide, onRollbackHide, requesterActorId, targetActorId])

  return { busy, accept, decline }
}
