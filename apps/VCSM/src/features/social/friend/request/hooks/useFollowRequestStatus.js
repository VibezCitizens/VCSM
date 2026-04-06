import { useEffect, useState } from 'react'
import { ctrlGetFollowRequestStatus } from '@/features/social/friend/request/controllers/followRequests.controller'

export function useFollowRequestStatus({
  requesterActorId,
  targetActorId,
}) {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    if (!requesterActorId || !targetActorId) return
    ctrlGetFollowRequestStatus({ requesterActorId, targetActorId })
      .then(setStatus)
      .catch(() => setStatus(null))
  }, [requesterActorId, targetActorId])

  return status
}
