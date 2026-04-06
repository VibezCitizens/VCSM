import { useNavigate } from 'react-router-dom'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

export default function FollowNotificationItem({ notification }) {
  const navigate = useNavigate()

  if (!notification) return null

  return (
    <NotificationCard
      actor={notification.sender}
      message="subscribed to you"
      timestamp={notification.createdAt}
      unread={!notification.isRead}
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
