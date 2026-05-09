import { useNavigate } from 'react-router-dom'
import { AtSign } from 'lucide-react'
import { useTranslation } from '@i18n'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

export default function PostMentionNotificationItem({ notification }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  if (!notification) return null

  return (
    <NotificationCard
      actor={notification.sender}
      message={
        <span className="inline-flex items-center gap-1">
          {t('notifications.reaction.mentionedVibe')}
          <AtSign className="w-4 h-4 text-purple-400" />
        </span>
      }
      timestamp={notification.createdAt}
      onClick={notification.linkPath ? () => navigate(notification.linkPath) : undefined}
    />
  )
}
