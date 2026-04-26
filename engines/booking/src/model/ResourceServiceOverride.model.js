export function mapResourceServiceOverrideRow(row) {
  if (!row) return null
  return {
    resourceId:        row.resource_id,
    serviceId:         row.service_id,
    priceCents:        row.price_cents ?? null,
    durationMinutes:   row.duration_minutes ?? null,
    isBookable:        row.is_bookable ?? true,
    createdAt:         row.created_at,
    updatedAt:         row.updated_at,
  }
}

export function mapResourceServiceOverrideRows(rows) {
  return Array.isArray(rows) ? rows.map(mapResourceServiceOverrideRow) : []
}

/**
 * Resolve effective pricing/duration for a service on a resource.
 * Priority: resource_service_overrides → service_booking_profiles → fallback
 *
 * @param {Object|null} override - from mapResourceServiceOverrideRow
 * @param {Object|null} serviceProfile - from mapBookingServiceProfileRow
 * @returns {{ durationMinutes: number, priceCents: number|null, source: string }}
 */
export function resolveServicePricing(override, serviceProfile) {
  if (override && override.durationMinutes != null) {
    return {
      durationMinutes: override.durationMinutes,
      priceCents:      override.priceCents ?? null,
      source:          'resource_override',
    }
  }
  if (serviceProfile && serviceProfile.durationMinutes != null) {
    return {
      durationMinutes: serviceProfile.durationMinutes,
      priceCents:      serviceProfile.priceCents ?? null,
      source:          'service_profile',
    }
  }
  return {
    durationMinutes: 60,
    priceCents:      null,
    source:          'fallback',
  }
}
