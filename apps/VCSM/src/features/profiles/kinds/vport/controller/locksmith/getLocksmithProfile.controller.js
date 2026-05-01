import { dalListLocksmithServiceAreas } from '@/features/profiles/kinds/vport/dal/locksmith/locksmithServiceAreas.read.dal'
import { dalListLocksmithServiceDetails } from '@/features/profiles/kinds/vport/dal/locksmith/locksmithServiceDetails.read.dal'
import { readVportServicesByActor } from '@/features/profiles/kinds/vport/dal/services/readVportServicesByActor.dal'

function mapServiceArea(row) {
  if (!row) return null
  return {
    id: row.id,
    areaType: row.area_type,
    label: row.label ?? '',
    city: row.city ?? null,
    stateCode: row.state_code ?? null,
    zipCode: row.zip_code ?? null,
    radiusMiles: row.radius_miles != null ? parseFloat(row.radius_miles) : null,
    travelFeeCents: row.travel_fee_cents ?? 0,
    minEtaMinutes: row.min_eta_minutes ?? null,
    maxEtaMinutes: row.max_eta_minutes ?? null,
    isEmergencyCovered: row.is_emergency_covered ?? false,
    notes: row.notes ?? '',
  }
}

function mapServiceDetail(row) {
  if (!row) return null
  return {
    serviceId: row.service_id,
    serviceFamily: row.service_family,
    serviceKind: row.service_kind,
    isMobileService: row.is_mobile_service ?? false,
    isEmergency: row.is_emergency ?? false,
    isAfterHoursAvailable: row.is_after_hours_available ?? false,
    requiresPropertyAddress: row.requires_property_address ?? false,
    requiresVehicleInfo: row.requires_vehicle_info ?? false,
    requiresProofOfOwnership: row.requires_proof_of_ownership ?? false,
    requiresPhotoId: row.requires_photo_id ?? false,
    pricingModel: row.pricing_model ?? 'fixed',
    startingPriceCents: row.starting_price_cents ?? null,
    maxPriceCents: row.max_price_cents ?? null,
    etaMinMinutes: row.eta_min_minutes ?? null,
    etaMaxMinutes: row.eta_max_minutes ?? null,
    warrantyDays: row.warranty_days ?? null,
    notes: row.notes ?? '',
  }
}

/**
 * Fetches and maps all locksmith profile data for a given actor.
 * Returns empty arrays for non-locksmith actors.
 *
 * @returns {{ serviceAreas: object[], serviceDetails: object[], gapServices: object[] }}
 */
export async function getLocksmithProfileController(actorId) {
  if (!actorId) return { serviceAreas: [], serviceDetails: [], gapServices: [] }

  const [areas, details, enabledServices] = await Promise.all([
    dalListLocksmithServiceAreas(actorId),
    dalListLocksmithServiceDetails(actorId),
    readVportServicesByActor({ actorId, includeDisabled: false }),
  ])

  const mappedDetails = (details ?? []).map(mapServiceDetail).filter(Boolean)
  const detailServiceIds = new Set(mappedDetails.map((d) => d.serviceId))
  const gapServices = (enabledServices ?? []).filter((s) => s.id && !detailServiceIds.has(s.id))

  return {
    serviceAreas: (areas ?? []).map(mapServiceArea).filter(Boolean),
    serviceDetails: mappedDetails,
    gapServices,
  }
}
