import { useNavigate } from 'react-router-dom'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

function formatSlotTime(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export default function BookingCreatedNotificationItem({ notification }) {
  const navigate = useNavigate()
  const { identity } = useIdentity()
  if (!notification) return null

  const service = notification.context?.serviceLabelSnapshot ?? 'a service'
  const time = formatSlotTime(notification.context?.startsAt)
  const timeLabel = time ? ` at ${time}` : ''

  // Use stored linkPath when it already points to the dashboard (new format).
  // Fall back to identity.actorId for legacy notifications with old profile paths.
  const linkPath = notification.linkPath ?? ""
  const destination = linkPath.includes("/dashboard/booking-history")
    ? linkPath
    : (identity?.actorId
        ? `/actor/${identity.actorId}/dashboard/booking-history`
        : linkPath || null)

  return (
    <NotificationCard
      actor={notification.sender}
      message={`booked ${service}${timeLabel}`}
      timestamp={notification.createdAt}
      unread={!notification.isRead}
      onClick={destination ? () => navigate(destination) : undefined}
    />
  )
}
