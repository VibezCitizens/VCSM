import { dalGetBookingResourceById, dalListBookingResourceServicesByResourceId } from '../dal/resource.read.dal.js'
import { dalGetVportResourceById } from '../dal/vportResource.read.dal.js'
import { dalListAvailabilityRulesByResourceId, dalListAvailabilityExceptionsInRange } from '../dal/availability.read.dal.js'
import { dalListVportAvailabilityRulesByResourceId, dalListVportAvailabilityExceptionsInRange } from '../dal/vportAvailability.read.dal.js'
import { dalListBookingsInRange } from '../dal/booking.read.dal.js'
import { dalListVportBookingsInRange } from '../dal/vportBooking.read.dal.js'
import { dalListBookingServiceProfilesByServiceIds } from '../dal/serviceProfile.read.dal.js'
import { mapResourceAvailabilityModel } from '../model/BookingAvailability.model.js'

const TTL = 300_000 // 5 minutes
const _cache = new Map()

function cacheGet(key) {
  const entry = _cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > TTL) { _cache.delete(key); return null }
  return entry.value
}

function cacheSet(key, value) {
  _cache.set(key, { value, ts: Date.now() })
}

export function invalidateBookingAvailability() {
  _cache.clear()
}

export async function getResourceAvailability({
  resourceId, rangeStart, rangeEnd,
  statuses = null, exceptionTypes = null, publicMode = false,
} = {}) {
  if (!resourceId)  throw new Error('[BookingEngine] resourceId is required')
  if (!rangeStart)  throw new Error('[BookingEngine] rangeStart is required')
  if (!rangeEnd)    throw new Error('[BookingEngine] rangeEnd is required')

  const cacheKey = `${resourceId}:${rangeStart}:${rangeEnd}:${publicMode ? 'pub' : 'own'}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  // ── Detect resource source ─────────────────────────────────────────────────
  const vportResource = await dalGetVportResourceById({ resourceId }).catch(() => null)

  if (vportResource) {
    // ── VPORT FLOW: read from vport.availability_rules/exceptions + vport.bookings ──
    const [rules, exceptions, bookings] = await Promise.all([
      dalListVportAvailabilityRulesByResourceId({ resourceId }),
      dalListVportAvailabilityExceptionsInRange({ resourceId, rangeStart, rangeEnd, exceptionTypes }),
      dalListVportBookingsInRange({ resourceId, rangeStart, rangeEnd, statuses, publicMode }),
    ])

    const result = mapResourceAvailabilityModel({
      resource:        vportResource,
      rules,
      exceptions,
      bookings,
      serviceProfiles: [],
      isVportResource: true,
    })
    cacheSet(cacheKey, result)
    return result
  }

  // ── LEGACY VC FLOW: read from vc.booking_availability_rules/exceptions + vc.bookings ──
  const resource = await dalGetBookingResourceById({ resourceId })
  if (!resource) throw new Error('Booking resource not found.')

  const [rules, exceptions, bookings] = await Promise.all([
    dalListAvailabilityRulesByResourceId({ resourceId }),
    dalListAvailabilityExceptionsInRange({ resourceId, rangeStart, rangeEnd, exceptionTypes }),
    dalListBookingsInRange({ resourceId, rangeStart, rangeEnd, statuses, publicMode }),
  ])

  let serviceProfiles = []
  try {
    const resourceServices = await dalListBookingResourceServicesByResourceId({ resourceId, includeInactive: false })
    const serviceIds = [...new Set(
      (Array.isArray(resourceServices) ? resourceServices : [])
        .map((r) => r?.service_id).filter(Boolean).map(String)
    )]
    serviceProfiles = serviceIds.length
      ? await dalListBookingServiceProfilesByServiceIds({ serviceIds, includeNonBookable: false })
      : []
  } catch { serviceProfiles = [] }

  const result = mapResourceAvailabilityModel({ resource, rules, exceptions, bookings, serviceProfiles })
  cacheSet(cacheKey, result)
  return result
}
