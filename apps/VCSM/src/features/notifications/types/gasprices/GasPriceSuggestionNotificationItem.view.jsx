import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@i18n'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import NotificationCard from '@/features/notifications/types/components/NotificationCard'

// Renders the inbox row for a citizen-submitted gas price suggestion.
// Engine eventKey 'vport.gas_price_suggestion' normalizes to kind
// 'vport_gas_price_suggestion' (see inbox/model/notification.model.js).
export default function GasPriceSuggestionNotificationItem({ notification }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { identity } = useIdentity()
  if (!notification) return null

  // TICKET-FUEL-BATCH-NOTIF-001: one card per submission batch.
  // New batch notifications carry context.count (+ fuelKeys); legacy per-fuel
  // notifications carry only context.fuelKey, which resolves to count === 1.
  const ctx = notification.context ?? {}
  const fuelKeys = Array.isArray(ctx.fuelKeys) ? ctx.fuelKeys.filter(Boolean) : []
  const count = Number(ctx.count) || fuelKeys.length || (ctx.fuelKey ? 1 : 0)
  const singleFuelKey = ctx.fuelKey ?? (fuelKeys.length === 1 ? fuelKeys[0] : null)

  let message
  if (count > 1) {
    message = t('notifications.gas.suggestedBatch', { count })
  } else if (singleFuelKey) {
    message = t('notifications.gas.suggested', { fuel: t(`notifications.gas.fuel.${singleFuelKey}`) })
  } else {
    message = t('notifications.gas.suggestedGeneric')
  }

  // The recipient of this notification is the gas station VPORT, and the owner
  // views it while their active actor IS that VPORT. Derive the dashboard path
  // from the active identity rather than a stored UUID — no raw actor id is
  // persisted on the notification row. Prefer an explicit linkPath if one is
  // ever provided by the engine.
  const dashboardPath =
    identity?.kind === 'vport' && identity?.actorId
      ? `/actor/${identity.actorId}/dashboard/gas`
      : null
  const targetPath = notification.linkPath || dashboardPath

  return (
    <NotificationCard
      actor={notification.sender}
      message={message}
      timestamp={notification.createdAt}
      onClick={targetPath ? () => navigate(targetPath) : undefined}
    />
  )
}
