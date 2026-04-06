import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'
import { useFollowRequestActions } from '@/features/social/adapters/friend/request/hooks/useFollowRequestActions.adapter'

export default function FollowRequestItem({ notification }) {
  const navigate = useNavigate()
  const { acceptRequest, declineRequest } = useFollowRequestActions()
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
      await acceptRequest({
        requesterActorId,
        targetActorId,
      })

      // ✅ Optimistically replace follow_request → follow
      const optimisticFollow = {
        ...notification,
        id: `optimistic-follow-${notification.id}`,
        kind: 'follow',
        createdAt: new Date().toISOString(),
        isRead: false,
        isSeen: false,
        // trigger uses object_type='actor' for follow
        objectType: 'actor',
        objectId: requesterActorId,
        linkPath: notification.linkPath || `/profile/${requesterActorId}`,
        context: {
          ...(notification.context || {}),
          followerActorId: requesterActorId,
          followedActorId: targetActorId,
        },
      }

      window.dispatchEvent(
        new CustomEvent('noti:optimistic:replace', {
          detail: {
            removeId: notification.id,
            add: optimisticFollow,
          },
        })
      )

      // optional: make sure header/badges update too
      window.dispatchEvent(new Event('noti:refresh'))
    } catch (err) {
      console.error('Accept failed', err)
      setHidden(false)
      setBusy(false)
    }
  }

  async function decline() {
    if (busy) return
    setBusy(true)
    setHidden(true)

    try {
      await declineRequest({
        requesterActorId,
        targetActorId,
      })
    } catch (err) {
      console.error('Decline failed', err)
      setHidden(false)
      setBusy(false)
    }
  }

  return (
    <NotificationCard
      actor={notification.sender}
      message="sent you a subscribe request"
      timestamp={notification.createdAt}
      unread={!notification.isRead}
      actions={
        <>
          <button
            disabled={busy}
            onClick={accept}
            className="
              notifications-action-btn notifications-action-btn--accept
              disabled:opacity-50
            "
          >
            Accept
          </button>

          <button
            disabled={busy}
            onClick={decline}
            className="
              notifications-action-btn notifications-action-btn--decline
              disabled:opacity-50
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
