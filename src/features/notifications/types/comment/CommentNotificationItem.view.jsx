// src/features/notifications/types/comment/CommentNotificationItem.view.jsx
// ============================================================
// CommentNotificationItem
// - Uses NotificationCard (shared shell)
// - Actor avatar + name handled centrally
// - Square avatar
// - Presentation-only
// ============================================================

import { useNavigate } from 'react-router-dom'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

export default function CommentNotificationItem({ notification }) {
  const navigate = useNavigate()

  if (!notification) return null

  return (
    <NotificationCard
      actor={notification.sender}
      message="sparked on your Vibe"
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
