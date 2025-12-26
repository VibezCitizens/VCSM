// src/features/notifications/types/comment/CommentLikeNotificationItem.view.jsx
// ============================================================
// CommentLikeNotificationItem
// - Uses NotificationCard (shared shell)
// - Heart icon for like
// - Presentation-only
// ============================================================

import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

export default function CommentLikeNotificationItem({ notification }) {
  const navigate = useNavigate()

  if (!notification) return null

  return (
    <NotificationCard
      actor={notification.sender}
      timestamp={notification.createdAt}
      actionLabel={notification.linkPath ? 'View' : null}
      onAction={
        notification.linkPath
          ? () => navigate(notification.linkPath)
          : null
      }
      message={
        <span className="flex items-center gap-1">
          <Heart
            size={14}
            className="text-pink-500 fill-pink-500"
          />
          <span>liked your comment</span>
        </span>
      }
    />
  )
}
