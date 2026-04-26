import { assertActorCanManageResource } from './assertActorCanManageResource.controller.js'
import { dalUpsertResourceServiceOverride } from '../dal/resourceServiceOverride.write.dal.js'
import { mapResourceServiceOverrideRow } from '../model/ResourceServiceOverride.model.js'

export async function upsertResourceServiceOverride({
  requestActorId,
  resourceId,
  serviceId,
  priceCents = null,
  durationMinutes = null,
  isBookable = true,
}) {
  if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required')
  if (!resourceId)     throw new Error('[BookingEngine] resourceId is required')
  if (!serviceId)      throw new Error('[BookingEngine] serviceId is required')

  await assertActorCanManageResource({ requestActorId, resourceId })

  const row = await dalUpsertResourceServiceOverride({
    resourceId, serviceId, priceCents, durationMinutes, isBookable,
  })
  return mapResourceServiceOverrideRow(row)
}
