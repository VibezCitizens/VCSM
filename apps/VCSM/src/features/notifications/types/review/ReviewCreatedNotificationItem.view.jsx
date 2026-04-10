import { useNavigate } from 'react-router-dom'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

export default function ReviewCreatedNotificationItem({ notification }) {
  const navigate = useNavigate()
  if (!notification) return null

  const rating = notification.context?.overallRating
  const ratingText = rating != null ? ` (${Number(rating).toFixed(1)}/5)` : ''

  return (
    <NotificationCard
      actor={notification.sender}
      message={`reviewed your business${ratingText}`}
      timestamp={notification.createdAt}
      unread={!notification.isRead}
      onClick={notification.linkPath ? () => navigate(notification.linkPath) : undefined}
    />
  )
}
