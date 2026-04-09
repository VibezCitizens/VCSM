// ============================================================
// VCSM — Locksmith Service Details Write DAL
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

const RETURN_COLUMNS = `
  service_id, actor_id, service_family, service_kind,
  is_mobile_service, is_emergency, is_after_hours_available,
  requires_property_address, requires_vehicle_info,
  requires_proof_of_ownership, requires_photo_id,
  pricing_model, starting_price_cents, max_price_cents,
  eta_min_minutes, eta_max_minutes, warranty_days,
  notes, meta, created_at, updated_at
`

export async function dalUpsertLocksmithServiceDetail(row) {
  if (!row?.service_id || !row?.actor_id) throw new Error('service_id and actor_id required')

  const { data, error } = await supabase
    .schema('vc')
    .from('vport_locksmith_service_details')
    .upsert(row, { onConflict: 'service_id' })
    .select(RETURN_COLUMNS)

  if (error) throw error
  return data?.[0] ?? null
}

export async function dalDeleteLocksmithServiceDetail(serviceId) {
  if (!serviceId) throw new Error('serviceId required')

  const { error } = await supabase
    .schema('vc')
    .from('vport_locksmith_service_details')
    .delete()
    .eq('service_id', serviceId)

  if (error) throw error
}
