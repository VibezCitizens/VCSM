import { useNavigate } from 'react-router-dom'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

export default function TeamInviteNotificationItem({ notification }) {
  const navigate = useNavigate()

  if (!notification) return null

  return (
    <NotificationCard
      actor={notification.sender}
      message="invited you to join their team"
      timestamp={notification.createdAt}
      unread={!notification.isRead}
      onClick={notification.linkPath ? () => navigate(notification.linkPath) : undefined}
    />
  )
}
