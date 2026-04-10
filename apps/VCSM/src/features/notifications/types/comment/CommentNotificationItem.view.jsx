import { useNavigate } from 'react-router-dom'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

export default function CommentNotificationItem({ notification }) {
  const navigate = useNavigate()
  if (!notification) return null

  return (
    <NotificationCard
      actor={notification.sender}
      message="commented on your Spark 💬"
      timestamp={notification.createdAt}
      onClick={notification.linkPath ? () => navigate(notification.linkPath) : undefined}
    />
  )
}
