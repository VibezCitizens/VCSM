import { useNavigate } from 'react-router-dom'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import { useTranslation } from '@i18n'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

function formatSlotTime(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export default function BookingConfirmedNotificationItem({ notification }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { identity } = useIdentity()
  if (!notification) return null

  const service = notification.context?.serviceLabelSnapshot ?? t('notifications.booking.defaultBooking')
  const time = formatSlotTime(notification.context?.startsAt)
  const message = time
    ? t('notifications.booking.confirmedAt', { service, time })
    : t('notifications.booking.confirmed', { service })

  return (
    <NotificationCard
      actor={notification.sender}
      message={message}
      timestamp={notification.createdAt}
      unread={!notification.isRead}
      onClick={identity?.actorId ? () => navigate(`/actor/${identity.actorId}/dashboard/booking-history`) : undefined}
    />
  )
}
