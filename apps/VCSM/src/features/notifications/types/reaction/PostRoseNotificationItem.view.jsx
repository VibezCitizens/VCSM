import { useNavigate } from 'react-router-dom'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

export default function PostRoseNotificationItem({ notification }) {
  const navigate = useNavigate()
  if (!notification) return null

  return (
    <NotificationCard
      actor={notification.sender}
      message="sent a rose to your Vibe 🌹"
      timestamp={notification.createdAt}
      onClick={notification.linkPath ? () => navigate(notification.linkPath) : undefined}
    />
  )
}
