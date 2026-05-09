import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@i18n'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

export default function PostRoseNotificationItem({ notification }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  if (!notification) return null

  return (
    <NotificationCard
      actor={notification.sender}
      message={t('notifications.reaction.roseVibe')}
      timestamp={notification.createdAt}
      onClick={notification.linkPath ? () => navigate(notification.linkPath) : undefined}
    />
  )
}
