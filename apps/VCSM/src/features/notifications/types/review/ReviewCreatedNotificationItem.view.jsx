import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@i18n'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

export default function ReviewCreatedNotificationItem({ notification }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  if (!notification) return null

  const rating = notification.context?.overallRating
  const message = rating != null
    ? t('notifications.review.reviewedRated', { rating: Number(rating).toFixed(1) })
    : t('notifications.review.reviewed')

  return (
    <NotificationCard
      actor={notification.sender}
      message={message}
      timestamp={notification.createdAt}
      unread={!notification.isRead}
      onClick={notification.linkPath ? () => navigate(notification.linkPath) : undefined}
    />
  )
}
