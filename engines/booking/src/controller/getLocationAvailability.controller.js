import { dalListBookingResourcesByLocationId } from '../dal/resource.read.dal.js'
import { getResourceAvailability } from './getResourceAvailability.controller.js'

/**
 * Fetch availability for all active resources at a location in parallel.
 * Used by the "any_available" booking mode to show merged free slots across staff.
 *
 * @param {{ locationId: string, rangeStart: string, rangeEnd: string, publicMode?: boolean }} params
 * @returns {{ resourceId: string, availability: object }[]}
 */
export async function getLocationAvailability({ locationId, rangeStart, rangeEnd, publicMode = true }) {
  if (!locationId)  throw new Error('[BookingEngine] locationId is required')
  if (!rangeStart)  throw new Error('[BookingEngine] rangeStart is required')
  if (!rangeEnd)    throw new Error('[BookingEngine] rangeEnd is required')

  const resources = await dalListBookingResourcesByLocationId({ locationId, includeInactive: false })
  if (!resources.length) return []

  const results = await Promise.allSettled(
    resources.map((r) =>
      getResourceAvailability({ resourceId: r.id, rangeStart, rangeEnd, publicMode })
        .then((availability) => ({ resourceId: r.id, resource: r, availability }))
    )
  )

  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value)
}
