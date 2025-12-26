// src/features/notifications/types/reaction/PostRoseNotificationItem.view.jsx
// ============================================================
// PostRoseNotificationItem
// - Uses NotificationCard (shared shell)
// - Square avatar via ActorLink
// - Presentation-only
// ============================================================

import { useNavigate } from 'react-router-dom'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

export default function PostRoseNotificationItem({ notification }) {
  const navigate = useNavigate()

  if (!notification) return null

  return (
    <NotificationCard
      actor={notification.sender}
      message="sent you a 🌹 on your post"
      timestamp={notification.createdAt}
      actionLabel={notification.linkPath ? 'View' : null}
      onAction={
        notification.linkPath
          ? () => navigate(notification.linkPath)
          : null
      }
    />
  )
}
