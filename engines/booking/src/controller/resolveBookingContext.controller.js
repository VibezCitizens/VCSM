import { dalGetBookingResourceById, dalListBookingResourcesByLocationId } from '../dal/resource.read.dal.js'
import { dalGetPrimaryLocation } from '../dal/location.read.dal.js'
import { dalGetPrimaryOrganizationByProfile } from '../dal/organization.read.dal.js'
import { dalGetResourceServiceOverride } from '../dal/resourceServiceOverride.read.dal.js'
import { dalListBookingServiceProfilesByServiceIds } from '../dal/serviceProfile.read.dal.js'
import { mapBookingResourceRow, mapBookingResourceRows } from '../model/BookingResource.model.js'
import { mapResourceServiceOverrideRow } from '../model/ResourceServiceOverride.model.js'
import { resolveServicePricing } from '../model/ResourceServiceOverride.model.js'

/**
 * Resolve the full booking context for a given profile + optional filters.
 *
 * Modes:
 *   selected_resource  — resourceId provided; resolve that exact resource
 *   any_available      — locationId provided; pick earliest bookable staff resource
 *   primary_calendar   — no resource/location; look up primary org → primary location → any available
 *
 * @param {{
 *   profileId: string,
 *   resourceId?: string|null,
 *   locationId?: string|null,
 *   serviceId?: string|null,
 * }} params
 * @returns {{
 *   mode: string,
 *   resource: object|null,
 *   resources: object[],
 *   location: object|null,
 *   organization: object|null,
 *   pricing: object|null,
 * }}
 */
export async function resolveBookingContext({ profileId, resourceId = null, locationId = null, serviceId = null }) {
  if (!profileId) throw new Error('[BookingEngine] profileId is required')

  // ── Mode: selected_resource ──────────────────────────────
  if (resourceId) {
    const resourceRow = await dalGetBookingResourceById({ resourceId })
    if (!resourceRow || !resourceRow.is_active) throw new Error('Resource not found or inactive.')

    const resource = mapBookingResourceRow(resourceRow)
    const pricing = serviceId ? await _resolveServicePricing({ resourceId, serviceId }) : null

    return {
      mode:         'selected_resource',
      resource,
      resources:    [resource],
      location:     null,
      organization: null,
      pricing,
    }
  }

  // ── Mode: any_available (locationId provided) ────────────
  if (locationId) {
    const resourceRows = await dalListBookingResourcesByLocationId({ locationId, includeInactive: false })
    const resources = mapBookingResourceRows(resourceRows)
    const primary = resources[0] ?? null

    const pricing = (serviceId && primary)
      ? await _resolveServicePricing({ resourceId: primary.id, serviceId })
      : null

    return {
      mode:         'any_available',
      resource:     primary,
      resources,
      location:     null,
      organization: null,
      pricing,
    }
  }

  // ── Mode: primary_calendar (fall back via profile → org → location) ──
  const orgProfile = await dalGetPrimaryOrganizationByProfile({ profileId })
  if (orgProfile?.organizations) {
    const org = orgProfile.organizations
    const primaryLocation = await dalGetPrimaryLocation({ organizationId: org.id })

    if (primaryLocation) {
      const resourceRows = await dalListBookingResourcesByLocationId({
        locationId: primaryLocation.id,
        includeInactive: false,
      })
      const resources = mapBookingResourceRows(resourceRows)
      const primary = resources[0] ?? null

      const pricing = (serviceId && primary)
        ? await _resolveServicePricing({ resourceId: primary.id, serviceId })
        : null

      return {
        mode:         'primary_calendar',
        resource:     primary,
        resources,
        location:     primaryLocation,
        organization: org,
        pricing,
      }
    }
  }

  // No org/location found — return empty context (legacy barber flow applies)
  return {
    mode:         'primary_calendar',
    resource:     null,
    resources:    [],
    location:     null,
    organization: null,
    pricing:      null,
  }
}

async function _resolveServicePricing({ resourceId, serviceId }) {
  const [overrideRow, profileRows] = await Promise.all([
    dalGetResourceServiceOverride({ resourceId, serviceId }).catch(() => null),
    dalListBookingServiceProfilesByServiceIds({ serviceIds: [serviceId], includeNonBookable: false }).catch(() => []),
  ])

  const override = overrideRow ? mapResourceServiceOverrideRow(overrideRow) : null
  const serviceProfile = Array.isArray(profileRows) && profileRows.length ? profileRows[0] : null

  return resolveServicePricing(override, serviceProfile)
}
