import { useNavigate } from 'react-router-dom'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

export default function CommentLikeNotificationItem({ notification }) {
  const navigate = useNavigate()
  if (!notification) return null

  return (
    <NotificationCard
      actor={notification.sender}
      message="liked your Spark ❤️"
      timestamp={notification.createdAt}
      actionLabel={notification.linkPath ? 'View' : null}
      onAction={notification.linkPath ? () => navigate(notification.linkPath) : null}
    />
  )
}
