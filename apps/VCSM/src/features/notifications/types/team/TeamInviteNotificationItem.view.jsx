import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@i18n'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

export default function TeamInviteNotificationItem({ notification }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (!notification) return null

  return (
    <NotificationCard
      actor={notification.sender}
      message={t('notifications.team.invitedToJoin')}
      timestamp={notification.createdAt}
      unread={!notification.isRead}
      onClick={notification.linkPath ? () => navigate(notification.linkPath) : undefined}
    />
  )
}
