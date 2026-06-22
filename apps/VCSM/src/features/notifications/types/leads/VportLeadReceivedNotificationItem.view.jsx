import { useNavigate } from 'react-router-dom'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

export default function VportLeadReceivedNotificationItem({ notification }) {
  const navigate = useNavigate()
  if (!notification) return null

  const leadName = notification.context?.leadName || 'Someone'
  const destination = notification.linkPath || null

  const actor = {
    displayName: leadName,
    avatar: '/avatar.jpg',
    route: null,
  }

  return (
    <NotificationCard
      actor={actor}
      message="sent you a lead"
      timestamp={notification.createdAt}
      unread={!notification.isRead}
      onClick={destination ? () => navigate(destination) : undefined}
    />
  )
}
