// ============================================================
// VCSM — Locksmith Service Details Read DAL
// ============================================================

import vportSchema from '@/services/supabase/vportClient'

const DETAIL_COLUMNS = `
  service_id, actor_id, service_family, service_kind,
  is_mobile_service, is_emergency, is_after_hours_available,
  requires_property_address, requires_vehicle_info,
  requires_proof_of_ownership, requires_photo_id,
  pricing_model, starting_price_cents, max_price_cents,
  eta_min_minutes, eta_max_minutes, warranty_days,
  notes, meta, created_at, updated_at
`

/**
 * Fetch all locksmith service details for an actor.
 */
export async function dalListLocksmithServiceDetails(actorId) {
  if (!actorId) return []

  const { data, error } = await vportSchema
    .from('locksmith_service_details')
    .select(DETAIL_COLUMNS)
    .eq('actor_id', actorId)

  if (error) throw error
  return data ?? []
}

/**
 * Fetch locksmith detail for a single service.
 */
export async function dalGetLocksmithServiceDetail(serviceId) {
  if (!serviceId) return null

  const { data, error } = await vportSchema
    .from('locksmith_service_details')
    .select(DETAIL_COLUMNS)
    .eq('service_id', serviceId)
    .limit(1)

  if (error) throw error
  return data?.[0] ?? null
}
