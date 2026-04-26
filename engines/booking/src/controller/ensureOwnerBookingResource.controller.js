import { dalListBookingResourcesByOwnerActorId, dalGetBookingResourceById } from '../dal/resource.read.dal.js'
import { dalInsertBookingResource } from '../dal/resource.write.dal.js'
import { assertActorOwnsVportActor } from './assertActorOwnsVportActor.controller.js'
import { mapBookingResourceRow } from '../model/BookingResource.model.js'

function pickPrimaryOrFirst(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null
  return (
    rows.find((x) => x?.resource_type === 'primary') ??
    rows.find((x) => x?.is_active === true) ??
    rows[0]
  )
}

export async function ensureOwnerBookingResource({ requestActorId, ownerActorId, timezone = 'UTC' } = {}) {
  if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required')
  if (!ownerActorId)   throw new Error('[BookingEngine] ownerActorId is required')

  await assertActorOwnsVportActor({ requestActorId, targetActorId: ownerActorId })

  const existing = pickPrimaryOrFirst(
    await dalListBookingResourcesByOwnerActorId({ ownerActorId, includeInactive: true })
  )
  if (existing) return mapBookingResourceRow(existing)

  try {
    const inserted = await dalInsertBookingResource({
      row: {
        owner_actor_id: ownerActorId,
        resource_type: 'primary',
        name: 'Default calendar',
        is_active: true,
        timezone: timezone || 'UTC',
        sort_order: 0,
      },
    })
    return mapBookingResourceRow(inserted)
  } catch {
    const after = pickPrimaryOrFirst(
      await dalListBookingResourcesByOwnerActorId({ ownerActorId, includeInactive: true })
    )
    if (after) return mapBookingResourceRow(after)
    throw new Error('Failed to ensure booking resource.')
  }
}
