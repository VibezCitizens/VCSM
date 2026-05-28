import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@i18n'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

export default function FollowNotificationItem({ notification }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (!notification) return null

  const senderRoute = notification.sender?.route
  const handleClick = senderRoute && senderRoute !== '#'
    ? () => navigate(senderRoute)
    : undefined

  return (
    <NotificationCard
      actor={notification.sender}
      message={t('notifications.follow.subscribed')}
      timestamp={notification.createdAt}
      unread={!notification.isRead}
      onClick={handleClick}
    />
  )
}
