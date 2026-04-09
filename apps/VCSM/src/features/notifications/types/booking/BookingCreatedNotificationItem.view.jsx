import { useNavigate } from 'react-router-dom'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

function formatSlotTime(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export default function BookingCreatedNotificationItem({ notification }) {
  const navigate = useNavigate()
  if (!notification) return null

  const service = notification.context?.serviceLabelSnapshot ?? 'a service'
  const time = formatSlotTime(notification.context?.startsAt)
  const timeLabel = time ? ` at ${time}` : ''

  return (
    <NotificationCard
      actor={notification.sender}
      message={`booked ${service}${timeLabel}`}
      timestamp={notification.createdAt}
      unread={!notification.isRead}
      secondaryAction={{
        label: 'View',
        onClick: () => notification.linkPath && navigate(notification.linkPath),
      }}
    />
  )
}
