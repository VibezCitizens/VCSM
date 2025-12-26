import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'
import {
  ctrlAcceptFollowRequest,
  ctrlDeclineFollowRequest,
} from '@/features/social/friend/request/controllers/followRequests.controller'

export default function FollowRequestItem({ notification }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [hidden, setHidden] = useState(false)

  if (!notification || hidden) return null

const requesterActorId =
  notification.context?.requesterActorId

const targetActorId =
  notification.context?.targetActorId
if (!requesterActorId || !targetActorId) {
  console.error(
    '[FollowRequestItem] missing actor ids',
    notification
  )
  return null
}


  async function accept() {
    if (busy) return
    setBusy(true)
    setHidden(true)

    try {
      await ctrlAcceptFollowRequest({
        requesterActorId,
        targetActorId,
      })
    } catch (err) {
      console.error('Accept failed', err)
      setHidden(false)
    }
  }

  async function decline() {
    if (busy) return
    setBusy(true)
    setHidden(true)

    try {
      await ctrlDeclineFollowRequest({
        requesterActorId,
        targetActorId,
      })
    } catch (err) {
      console.error('Decline failed', err)
      setHidden(false)
    }
  }

  return (
    <NotificationCard
      actor={notification.sender}
      message="sent you a follow request"
      timestamp={notification.createdAt}
      unread={!notification.isRead}
      actions={
        <>
          <button
            disabled={busy}
            onClick={accept}
            className="
              rounded-lg bg-emerald-700/70
              px-3 py-1 text-xs text-white
              hover:bg-emerald-700 disabled:opacity-50
            "
          >
            Accept
          </button>

          <button
            disabled={busy}
            onClick={decline}
            className="
              rounded-lg bg-neutral-700
              px-3 py-1 text-xs text-neutral-200
              hover:bg-neutral-600 disabled:opacity-50
            "
          >
            Decline
          </button>
        </>
      }
      secondaryAction={{
        label: 'View',
        onClick: () => {
          if (notification.linkPath) {
            navigate(notification.linkPath)
          }
        },
      }}
    />
  )
}
