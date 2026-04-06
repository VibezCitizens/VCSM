import { useNavigate } from 'react-router-dom'
import { AtSign } from 'lucide-react'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

export default function PostMentionNotificationItem({ notification }) {
  const navigate = useNavigate()
  if (!notification) return null

  return (
    <NotificationCard
      actor={notification.sender}
      message={
        <span className="inline-flex items-center gap-1">
          mentioned you in a Vibe
          <AtSign className="w-4 h-4 text-purple-400" />
        </span>
      }
      timestamp={notification.createdAt}
      actionLabel={notification.linkPath ? 'View' : null}
      onAction={notification.linkPath ? () => navigate(notification.linkPath) : null}
    />
  )
}
