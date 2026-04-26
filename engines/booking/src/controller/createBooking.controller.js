import { dalGetBookingResourceById, dalListBookingResourcesByLocationId } from '../dal/resource.read.dal.js'
import { dalGetActorById } from '../dal/actor.read.dal.js'
import { dalInsertBooking } from '../dal/booking.write.dal.js'
import { assertActorOwnsVportActor } from './assertActorOwnsVportActor.controller.js'
import { mapBookingRow } from '../model/Booking.model.js'
import { getNotifyFn } from '../config.js'
import { BOOKING_EVENTS } from '../events.js'

const MANAGEMENT_SOURCES = new Set(['owner', 'admin', 'import', 'sync'])
const CITIZEN_SOURCES    = new Set(['public'])

export async function createBooking({
  requestActorId = null,
  resourceId,
  locationId = null,
  serviceId = null,
  customerActorId = null,
  customerProfileId = null,
  status = null,
  source = 'public',
  startsAt,
  endsAt,
  timezone,
  serviceLabelSnapshot,
  durationMinutes,
  customerName = null,
  customerPhone = null,
  customerEmail = null,
  customerNote = null,
  internalNote = null,
} = {}) {
  if (!startsAt)              throw new Error('[BookingEngine] startsAt is required')
  if (!endsAt)                throw new Error('[BookingEngine] endsAt is required')
  if (!timezone)              throw new Error('[BookingEngine] timezone is required')
  if (!serviceLabelSnapshot)  throw new Error('[BookingEngine] serviceLabelSnapshot is required')
  if (!durationMinutes)       throw new Error('[BookingEngine] durationMinutes is required')

  // Resolve resourceId from locationId (any_available mode) when not explicitly given
  let resolvedResourceId = resourceId
  if (!resolvedResourceId && locationId) {
    const locationResources = await dalListBookingResourcesByLocationId({ locationId, includeInactive: false })
    if (!locationResources.length) throw new Error('No available resources at this location.')
    // Sort by sort_order ASC, then created_at ASC — pick first
    const sorted = [...locationResources].sort((a, b) => {
      if (a.sort_order !== b.sort_order) return (a.sort_order ?? 0) - (b.sort_order ?? 0)
      return new Date(a.created_at) - new Date(b.created_at)
    })
    resolvedResourceId = sorted[0].id
  }

  if (!resolvedResourceId) throw new Error('[BookingEngine] resourceId or locationId is required')

  const resource = await dalGetBookingResourceById({ resourceId: resolvedResourceId })
  if (!resource || resource.is_active !== true) {
    throw new Error('Booking resource is unavailable.')
  }

  if (MANAGEMENT_SOURCES.has(String(source))) {
    if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required for management source')
    await assertActorOwnsVportActor({ requestActorId, targetActorId: resource.owner_actor_id })
  }

  if (CITIZEN_SOURCES.has(String(source))) {
    if (!requestActorId) throw new Error('Only citizens can book appointments.')
    const actor = await dalGetActorById({ actorId: requestActorId })
    if (!actor || actor.is_void === true)  throw new Error('Only citizens can book appointments.')
    if (actor.kind !== 'user') throw new Error('Only citizens can book appointments. Switch to your citizen profile to reserve.')
  }

  const slotStart = new Date(startsAt).getTime()
  if (!Number.isFinite(slotStart) || slotStart <= Date.now()) {
    throw new Error('This time slot is no longer available.')
  }

  const inserted = await dalInsertBooking({
    row: {
      resource_id: resolvedResourceId, service_id: serviceId,
      customer_actor_id: customerActorId, customer_profile_id: customerProfileId,
      status, source, starts_at: startsAt, ends_at: endsAt, timezone,
      service_label_snapshot: serviceLabelSnapshot, duration_minutes: durationMinutes,
      customer_name: customerName, customer_phone: customerPhone,
      customer_email: customerEmail, customer_note: customerNote,
      internal_note: internalNote, created_by_actor_id: requestActorId,
    },
  })

  const mapped = mapBookingRow(inserted)

  if (source === 'public' && resource?.owner_actor_id && requestActorId) {
    if (String(requestActorId) !== String(resource.owner_actor_id)) {
      getNotifyFn()?.({
        recipientActorId: resource.owner_actor_id,
        actorId: requestActorId,
        kind: BOOKING_EVENTS.CREATED,
        objectType: 'booking',
        objectId: mapped.id,
        linkPath: `/profile/${resource.owner_actor_id}?tab=book`,
        context: { serviceLabelSnapshot, startsAt, customerName, status: mapped.status },
      })
    }
  }

  return mapped
}
