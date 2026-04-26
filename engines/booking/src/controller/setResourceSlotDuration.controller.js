import { dalGetBookingResourceById, dalListBookingResourceServicesByResourceId } from '../dal/resource.read.dal.js'
import { dalUpsertBookingResourceServices } from '../dal/resource.write.dal.js'
import { dalReadVportServicesByActor } from '../dal/actor.read.dal.js'
import { dalSaveServiceProfileDurationsByServiceIds } from '../dal/serviceProfile.write.dal.js'
import { assertActorOwnsVportActor } from './assertActorOwnsVportActor.controller.js'
import { mapBookingServiceProfileRows } from '../model/BookingServiceProfile.model.js'

function normalizeDuration(value, fallback = 30) {
  const m = Math.floor(Number(value))
  if (!Number.isFinite(m) || m < 5) return fallback
  return Math.min(240, m)
}

export async function setResourceSlotDuration({ requestActorId, resourceId, durationMinutes } = {}) {
  if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required')
  if (!resourceId)     throw new Error('[BookingEngine] resourceId is required')

  const duration = normalizeDuration(durationMinutes, 30)
  const resource = await dalGetBookingResourceById({ resourceId })
  if (!resource) throw new Error('Booking resource not found.')

  await assertActorOwnsVportActor({ requestActorId, targetActorId: resource.owner_actor_id })

  const resourceServices = await dalListBookingResourceServicesByResourceId({ resourceId, includeInactive: true })
  let serviceIds = [...new Set(
    (Array.isArray(resourceServices) ? resourceServices : [])
      .map((r) => r?.service_id).filter(Boolean).map(String)
  )]

  if (!serviceIds.length) {
    const vportServices = await dalReadVportServicesByActor({ actorId: resource.owner_actor_id, includeDisabled: true })
    const enabled = (Array.isArray(vportServices) ? vportServices : []).filter((r) => r?.enabled === true).map((r) => String(r.id)).filter(Boolean)
    const all     = (Array.isArray(vportServices) ? vportServices : []).map((r) => String(r.id)).filter(Boolean)
    serviceIds = [...new Set(enabled.length ? enabled : all)]
  }

  if (!serviceIds.length) {
    throw new Error('No enabled services found yet. Add at least one service, then save duration.')
  }

  await dalUpsertBookingResourceServices({
    rows: serviceIds.map((service_id) => ({ resource_id: resourceId, service_id, is_active: true })),
  })

  const savedRows = await dalSaveServiceProfileDurationsByServiceIds({ serviceIds, durationMinutes: duration })

  return {
    resourceId,
    durationMinutes: duration,
    serviceIds,
    serviceProfiles: mapBookingServiceProfileRows(savedRows),
  }
}
