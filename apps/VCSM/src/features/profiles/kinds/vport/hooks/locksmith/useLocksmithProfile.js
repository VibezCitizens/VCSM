// ============================================================
// VCSM — Locksmith Profile Data Hook
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import { dalListLocksmithServiceAreas } from '@/features/profiles/kinds/vport/dal/locksmith/locksmithServiceAreas.read.dal'
import { dalListLocksmithServiceDetails } from '@/features/profiles/kinds/vport/dal/locksmith/locksmithServiceDetails.read.dal'

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
 * Hook for locksmith-specific profile data (service areas + service details).
 * Returns null-safe data — non-locksmith vports get empty arrays.
 */
export function useLocksmithProfile(actorId, vportType) {
  const [serviceAreas, setServiceAreas] = useState([])
  const [serviceDetails, setServiceDetails] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const mountedRef = useRef(false)

  const isLocksmith = String(vportType ?? '').toLowerCase() === 'locksmith'

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const load = useCallback(async () => {
    if (!actorId || !isLocksmith) {
      setServiceAreas([])
      setServiceDetails([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [areas, details] = await Promise.all([
        dalListLocksmithServiceAreas(actorId),
        dalListLocksmithServiceDetails(actorId),
      ])

      if (!mountedRef.current) return

      setServiceAreas((areas ?? []).map(mapServiceArea).filter(Boolean))
      setServiceDetails((details ?? []).map(mapServiceDetail).filter(Boolean))
    } catch (e) {
      if (mountedRef.current) setError(e)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [actorId, isLocksmith])

  useEffect(() => {
    load()
  }, [load])

  return {
    isLocksmith,
    serviceAreas,
    serviceDetails,
    loading,
    error,
    reload: load,
  }
}
