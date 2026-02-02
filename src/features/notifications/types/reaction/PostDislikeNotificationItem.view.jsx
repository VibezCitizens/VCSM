// src/features/notifications/types/reaction/PostDislikeNotificationItem.view.jsx
// ============================================================
// PostDislikeNotificationItem
// - Uses NotificationCard (shared shell)
// - Square avatar via ActorLink
// - Presentation-only
// ============================================================

import { useNavigate } from 'react-router-dom'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

export default function PostDislikeNotificationItem({ notification }) {
  const navigate = useNavigate()

  if (!notification) return null

  return (
    <NotificationCard
      actor={notification.sender}
      message="disliked your Vibe"
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
