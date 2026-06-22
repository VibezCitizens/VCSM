// ============================================================
// VCSM — Locksmith Owner Controller
// ============================================================

import {
  dalInsertLocksmithServiceArea,
  dalUpdateLocksmithServiceArea,
  dalDeleteLocksmithServiceArea,
} from '@/features/profiles/kinds/vport/dal/locksmith/locksmithServiceAreas.write.dal'

import {
  dalUpsertLocksmithServiceDetail,
  dalDeleteLocksmithServiceDetail,
} from '@/features/profiles/kinds/vport/dal/locksmith/locksmithServiceDetails.write.dal'

import {
  dalUpsertLocksmithPortfolioDetail,
} from '@/features/profiles/kinds/vport/dal/locksmith/locksmithPortfolioDetails.write.dal'
import { assertSessionOwnsVportActorController } from '@/features/booking/adapters/booking.adapter'

// ── Service Areas ──

export async function ctrlAddServiceArea(identityActorId, actorId, area) {
  if (!identityActorId) throw new Error('[Locksmith] identityActorId required')
  if (!actorId) throw new Error('[Locksmith] actorId required')
  await assertSessionOwnsVportActorController({ targetActorId: actorId })
  return dalInsertLocksmithServiceArea({
    actor_id: actorId,
    area_type: area.areaType ?? 'city',
    label: area.label ?? '',
    country_code: area.countryCode ?? 'US',
    state_code: area.stateCode ?? null,
    city: area.city ?? null,
    zip_code: area.zipCode ?? null,
    center_lat: area.centerLat ?? null,
    center_lng: area.centerLng ?? null,
    radius_miles: area.radiusMiles ?? null,
    travel_fee_cents: area.travelFeeCents ?? 0,
    min_eta_minutes: area.minEtaMinutes ?? null,
    max_eta_minutes: area.maxEtaMinutes ?? null,
    is_emergency_covered: area.isEmergencyCovered ?? true,
    is_active: true,
    sort_order: area.sortOrder ?? 0,
    notes: area.notes ?? '',
  })
}

export async function ctrlUpdateServiceArea(identityActorId, actorId, areaId, updates) {
  if (!identityActorId) throw new Error('[Locksmith] identityActorId required')
  if (!actorId) throw new Error('[Locksmith] actorId required')
  if (!areaId) throw new Error('[Locksmith] areaId required')
  await assertSessionOwnsVportActorController({ targetActorId: actorId })
  const row = {}
  if (updates.label !== undefined) row.label = updates.label
  if (updates.areaType !== undefined) row.area_type = updates.areaType
  if (updates.city !== undefined) row.city = updates.city
  if (updates.stateCode !== undefined) row.state_code = updates.stateCode
  if (updates.zipCode !== undefined) row.zip_code = updates.zipCode
  if (updates.radiusMiles !== undefined) row.radius_miles = updates.radiusMiles
  if (updates.travelFeeCents !== undefined) row.travel_fee_cents = updates.travelFeeCents
  if (updates.minEtaMinutes !== undefined) row.min_eta_minutes = updates.minEtaMinutes
  if (updates.maxEtaMinutes !== undefined) row.max_eta_minutes = updates.maxEtaMinutes
  if (updates.isEmergencyCovered !== undefined) row.is_emergency_covered = updates.isEmergencyCovered
  if (updates.isActive !== undefined) row.is_active = updates.isActive
  if (updates.notes !== undefined) row.notes = updates.notes
  return dalUpdateLocksmithServiceArea(areaId, actorId, row)
}

export async function ctrlDeleteServiceArea(identityActorId, actorId, areaId) {
  if (!identityActorId) throw new Error('[Locksmith] identityActorId required')
  if (!actorId) throw new Error('[Locksmith] actorId required')
  if (!areaId) throw new Error('[Locksmith] areaId required')
  await assertSessionOwnsVportActorController({ targetActorId: actorId })
  return dalDeleteLocksmithServiceArea(areaId, actorId)
}

// ── Service Details ──

export async function ctrlSaveServiceDetail(identityActorId, actorId, serviceId, detail) {
  if (!identityActorId) throw new Error('[Locksmith] identityActorId required')
  if (!actorId || !serviceId) throw new Error('[Locksmith] actorId and serviceId required')
  await assertSessionOwnsVportActorController({ targetActorId: actorId })
  return dalUpsertLocksmithServiceDetail({
    service_id: serviceId,
    actor_id: actorId,
    service_family: detail.serviceFamily ?? 'residential',
    service_kind: detail.serviceKind ?? 'other',
    is_mobile_service: detail.isMobileService ?? true,
    is_emergency: detail.isEmergency ?? false,
    is_after_hours_available: detail.isAfterHoursAvailable ?? false,
    requires_property_address: detail.requiresPropertyAddress ?? false,
    requires_vehicle_info: detail.requiresVehicleInfo ?? false,
    requires_proof_of_ownership: detail.requiresProofOfOwnership ?? false,
    requires_photo_id: detail.requiresPhotoId ?? false,
    pricing_model: detail.pricingModel ?? 'fixed',
    starting_price_cents: detail.startingPriceCents ?? null,
    max_price_cents: detail.maxPriceCents ?? null,
    eta_min_minutes: detail.etaMinMinutes ?? null,
    eta_max_minutes: detail.etaMaxMinutes ?? null,
    warranty_days: detail.warrantyDays ?? null,
    notes: detail.notes ?? '',
  })
}

export async function ctrlDeleteServiceDetail(identityActorId, actorId, serviceId) {
  if (!identityActorId) throw new Error('[Locksmith] identityActorId required')
  if (!actorId) throw new Error('[Locksmith] actorId required')
  if (!serviceId) throw new Error('[Locksmith] serviceId required')
  await assertSessionOwnsVportActorController({ targetActorId: actorId })
  return dalDeleteLocksmithServiceDetail(serviceId, actorId)
}

// ── Portfolio Details ──

export async function ctrlSavePortfolioDetail(identityActorId, actorId, portfolioItemId, detail) {
  if (!identityActorId || !actorId || !portfolioItemId) throw new Error('[Locksmith] identityActorId, actorId, and portfolioItemId required')

  await assertSessionOwnsVportActorController({ targetActorId: actorId })

  return dalUpsertLocksmithPortfolioDetail({
    portfolio_item_id: portfolioItemId,
    job_type: detail.jobType ?? 'other',
    property_type: detail.propertyType ?? null,
    lock_type: detail.lockType ?? null,
    hardware_brand: detail.hardwareBrand ?? null,
    service_mode: detail.serviceMode ?? null,
    has_before_after: detail.hasBeforeAfter ?? false,
    is_emergency_job: detail.isEmergencyJob ?? false,
    is_security_upgrade: detail.isSecurityUpgrade ?? false,
    estimated_duration_minutes: detail.estimatedDurationMinutes ?? null,
    display_in_portfolio: true,
    notes: detail.notes ?? '',
  })
}
