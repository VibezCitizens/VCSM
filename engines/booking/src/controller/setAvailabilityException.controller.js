import { dalGetBookingResourceById } from '../dal/resource.read.dal.js'
import { dalGetVportResourceById } from '../dal/vportResource.read.dal.js'
import { dalUpsertAvailabilityException } from '../dal/availability.write.dal.js'
import { dalUpsertVportAvailabilityException } from '../dal/vportAvailability.write.dal.js'
import { assertActorOwnsVportActor } from './assertActorOwnsVportActor.controller.js'
import { assertActorCanManageResource } from './assertActorCanManageResource.controller.js'
import { mapAvailabilityExceptionRow } from '../model/BookingAvailability.model.js'

export async function setAvailabilityException({
  requestActorId, exceptionId = null, resourceId,
  exceptionType, startsAt, endsAt, note = undefined,
} = {}) {
  if (!requestActorId)  throw new Error('[BookingEngine] requestActorId is required')
  if (!resourceId)      throw new Error('[BookingEngine] resourceId is required')
  if (!exceptionType)   throw new Error('[BookingEngine] exceptionType is required')
  if (!startsAt)        throw new Error('[BookingEngine] startsAt is required')
  if (!endsAt)          throw new Error('[BookingEngine] endsAt is required')

  const vportResource = await dalGetVportResourceById({ resourceId }).catch(() => null)

  if (vportResource) {
    await assertActorCanManageResource({ requestActorId, resourceId })
    const saved = await dalUpsertVportAvailabilityException({
      row: {
        id: exceptionId ?? undefined,
        resource_id: resourceId, exception_type: exceptionType,
        starts_at: startsAt, ends_at: endsAt,
        note, created_by_actor_id: requestActorId,
      },
    })
    return mapAvailabilityExceptionRow(saved)
  }

  const resource = await dalGetBookingResourceById({ resourceId })
  if (!resource) throw new Error('Booking resource not found.')
  await assertActorOwnsVportActor({ requestActorId, targetActorId: resource.owner_actor_id })
  const saved = await dalUpsertAvailabilityException({
    row: {
      id: exceptionId ?? undefined,
      resource_id: resourceId, exception_type: exceptionType,
      starts_at: startsAt, ends_at: endsAt,
      note, created_by_actor_id: requestActorId,
    },
  })
  return mapAvailabilityExceptionRow(saved)
}
