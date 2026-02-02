// src/features/notifications/types/comment/CommentReplyNotificationItem.view.jsx
// ============================================================
// CommentReplyNotificationItem
// - Uses NotificationCard (shared shell)
// - Square avatar via ActorLink
// - Presentation-only
// ============================================================

import { useNavigate } from 'react-router-dom'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

export default function CommentReplyNotificationItem({ notification }) {
  const navigate = useNavigate()

  if (!notification) return null

  return (
    <NotificationCard
      actor={notification.sender}
      message="replied to your Spark"
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
