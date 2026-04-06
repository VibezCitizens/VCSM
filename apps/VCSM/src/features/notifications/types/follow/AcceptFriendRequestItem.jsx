// src/features/notifications/types/follow/AcceptFriendRequestItem.jsx
// ============================================================
// AcceptFriendRequestItem
// - Shown to requester when their follow request is accepted
// - Read-only informational notification
// ============================================================

import { useNavigate } from 'react-router-dom'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

export default function AcceptFriendRequestItem({ notification }) {
  const navigate = useNavigate()

  if (!notification) return null

  return (
    <NotificationCard
      actor={notification.sender}          // 👈 actor who accepted
      message="accepted your subscribe request."
      timestamp={notification.createdAt}
      unread={!notification.isRead}
      secondaryAction={{
        label: 'View profile',
        onClick: () => {
          if (notification.linkPath) {
            navigate(notification.linkPath)
          }
        },
      }}
    />
  )
}
