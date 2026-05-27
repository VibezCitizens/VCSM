import { dalGetBookingResourceById } from '../dal/resource.read.dal.js'
import { dalGetVportResourceById, dalListVportResourcesByLocationId } from '../dal/vportResource.read.dal.js'
import { dalGetActorById } from '../dal/actor.read.dal.js'
import { dalInsertBooking } from '../dal/booking.write.dal.js'
import { dalInsertVportBooking } from '../dal/vportBooking.write.dal.js'
import { assertActorOwnsVportActor } from './assertActorOwnsVportActor.controller.js'
import { assertActorCanManageResource } from './assertActorCanManageResource.controller.js'
import { mapBookingRow } from '../model/Booking.model.js'
import { getNotifyFn } from '../config.js'
import { BOOKING_EVENTS } from '../events.js'

const MANAGEMENT_SOURCES = new Set(['owner', 'admin', 'import', 'sync'])
const CITIZEN_SOURCES    = new Set(['public'])

export async function createBooking({
  requestActorId = null,
  resourceId = null,
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

  // durationMinutes bounds — checked before any DB call so validation fails fast.
  if (typeof durationMinutes !== 'number' || durationMinutes <= 0) {
    throw new Error('[BookingEngine] durationMinutes must be greater than 0')
  }
  if (durationMinutes > 1440) {
    throw new Error('[BookingEngine] durationMinutes cannot exceed 1440 (24 hours)')
  }

  // Source allowlist — unknown sources are rejected immediately before any resource lookup
  // or ownership check to prevent unaudited booking paths.
  const ALL_SOURCES = new Set([...MANAGEMENT_SOURCES, ...CITIZEN_SOURCES])
  if (!ALL_SOURCES.has(String(source))) {
    throw new Error(
      `[BookingEngine] Unknown booking source: "${source}". Allowed: ${[...ALL_SOURCES].join(', ')}`
    )
  }

  // Resolve resourceId from locationId (any_available mode) when not explicitly given.
  // Location-based resolution always points to vport.resources.
  let resolvedResourceId = resourceId
  if (!resolvedResourceId && locationId) {
    const locationResources = await dalListVportResourcesByLocationId({ locationId, includeInactive: false })
    if (!locationResources.length) throw new Error('No available resources at this location.')
    const sorted = [...locationResources].sort((a, b) => {
      if (a.sort_order !== b.sort_order) return (a.sort_order ?? 0) - (b.sort_order ?? 0)
      return new Date(a.created_at) - new Date(b.created_at)
    })
    resolvedResourceId = sorted[0].id
  }

  if (!resolvedResourceId) throw new Error('[BookingEngine] resourceId or locationId is required')

  const slotStart = new Date(startsAt).getTime()
  if (!Number.isFinite(slotStart) || slotStart <= Date.now()) {
    throw new Error('This time slot is no longer available.')
  }

  // ── Detect resource source ─────────────────────────────────────────────────
  const vportResource = await dalGetVportResourceById({ resourceId: resolvedResourceId }).catch(() => null)

  if (vportResource) {
    // ── VPORT FLOW: resource lives in vport.resources → insert into vport.bookings ──
    if (vportResource.is_active !== true) throw new Error('Booking resource is unavailable.')
    if (!vportResource.profile_id)        throw new Error('Booking resource has no associated profile.')

    if (MANAGEMENT_SOURCES.has(String(source))) {
      if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required for management source')
      await assertActorCanManageResource({ requestActorId, resourceId: resolvedResourceId })
    }

    if (CITIZEN_SOURCES.has(String(source))) {
      if (!requestActorId) throw new Error('Only citizens can book appointments.')
      const actor = await dalGetActorById({ actorId: requestActorId })
      if (!actor || actor.is_void === true) throw new Error('Only citizens can book appointments.')
      if (actor.kind !== 'user') throw new Error('Only citizens can book appointments. Switch to your citizen profile to reserve.')
    }

    const inserted = await dalInsertVportBooking({
      row: {
        resource_id:            resolvedResourceId,
        profile_id:             vportResource.profile_id,
        service_id:             serviceId,
        customer_actor_id:      customerActorId,
        status,
        source,
        starts_at:              startsAt,
        ends_at:                endsAt,
        timezone,
        service_label_snapshot: serviceLabelSnapshot,
        duration_minutes:       durationMinutes,
        customer_name:          customerName,
        customer_phone:         customerPhone,
        customer_email:         customerEmail,
        customer_note:          customerNote,
        internal_note:          internalNote,
        created_by_actor_id:    requestActorId,
      },
    })

    const mapped = mapBookingRow(inserted)

    if (source === 'public' && vportResource.owner_actor_id && requestActorId) {
      if (String(requestActorId) !== String(vportResource.owner_actor_id)) {
        getNotifyFn()?.({
          recipientActorId: vportResource.owner_actor_id,
          actorId:          requestActorId,
          kind:             BOOKING_EVENTS.CREATED,
          objectType:       'booking',
          objectId:         mapped.id,
          linkPath:         `/actor/${vportResource.owner_actor_id}/dashboard/booking-history`,
          context:          { serviceLabelSnapshot, startsAt, customerName, status: mapped.status },
        })
      }
    }

    return mapped
  }

  // ── LEGACY VC FLOW: resource lives in vc.booking_resources → insert into vc.bookings ──
  const resource = await dalGetBookingResourceById({ resourceId: resolvedResourceId })
  if (!resource || resource.is_active !== true) throw new Error('Booking resource is unavailable.')

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

  const inserted = await dalInsertBooking({
    row: {
      resource_id:            resolvedResourceId,
      service_id:             serviceId,
      customer_actor_id:      customerActorId,
      customer_profile_id:    customerProfileId,
      status,
      source,
      starts_at:              startsAt,
      ends_at:                endsAt,
      timezone,
      service_label_snapshot: serviceLabelSnapshot,
      duration_minutes:       durationMinutes,
      customer_name:          customerName,
      customer_phone:         customerPhone,
      customer_email:         customerEmail,
      customer_note:          customerNote,
      internal_note:          internalNote,
      created_by_actor_id:    requestActorId,
    },
  })

  const mapped = mapBookingRow(inserted)

  if (source === 'public' && resource?.owner_actor_id && requestActorId) {
    if (String(requestActorId) !== String(resource.owner_actor_id)) {
      getNotifyFn()?.({
        recipientActorId: resource.owner_actor_id,
        actorId:          requestActorId,
        kind:             BOOKING_EVENTS.CREATED,
        objectType:       'booking',
        objectId:         mapped.id,
        linkPath:         `/actor/${resource.owner_actor_id}/dashboard/booking-history`,
        context:          { serviceLabelSnapshot, startsAt, customerName, status: mapped.status },
      })
    }
  }

  return mapped
}
