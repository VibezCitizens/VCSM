import { dalGetBookingResourceById } from '../dal/resource.read.dal.js'
import { dalGetVportResourceById } from '../dal/vportResource.read.dal.js'
import { dalUpsertAvailabilityRule } from '../dal/availability.write.dal.js'
import { dalUpsertVportAvailabilityRule } from '../dal/vportAvailability.write.dal.js'
import { assertActorOwnsVportActor } from './assertActorOwnsVportActor.controller.js'
import { assertActorCanManageResource } from './assertActorCanManageResource.controller.js'
import { mapAvailabilityRuleRow } from '../model/BookingAvailability.model.js'

export async function setAvailabilityRule({
  requestActorId, ruleId = null, resourceId,
  ruleType = 'weekly', weekday, startTime, endTime,
  validFrom = undefined, validUntil = undefined, isActive = undefined,
} = {}) {
  if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required')
  if (!resourceId)     throw new Error('[BookingEngine] resourceId is required')
  if (weekday == null) throw new Error('[BookingEngine] weekday is required')
  if (!startTime)      throw new Error('[BookingEngine] startTime is required')
  if (!endTime)        throw new Error('[BookingEngine] endTime is required')

  const vportResource = await dalGetVportResourceById({ resourceId }).catch(() => null)

  if (vportResource) {
    await assertActorCanManageResource({ requestActorId, resourceId })
    const saved = await dalUpsertVportAvailabilityRule({
      row: {
        id: ruleId ?? undefined, resource_id: resourceId,
        rule_type: ruleType, weekday, start_time: startTime, end_time: endTime,
        valid_from: validFrom, valid_until: validUntil, is_active: isActive,
      },
    })
    return mapAvailabilityRuleRow(saved)
  }

  const resource = await dalGetBookingResourceById({ resourceId })
  if (!resource) throw new Error('Booking resource not found.')
  await assertActorOwnsVportActor({ requestActorId, targetActorId: resource.owner_actor_id })
  const saved = await dalUpsertAvailabilityRule({
    row: {
      id: ruleId ?? undefined, resource_id: resourceId,
      rule_type: ruleType, weekday, start_time: startTime, end_time: endTime,
      valid_from: validFrom, valid_until: validUntil, is_active: isActive,
    },
  })
  return mapAvailabilityRuleRow(saved)
}
