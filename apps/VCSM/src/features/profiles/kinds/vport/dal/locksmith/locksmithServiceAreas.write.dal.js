// ============================================================
// VCSM — Locksmith Service Areas Write DAL
// ============================================================

import vportSchema from '@/services/supabase/vportClient'

const RETURN_COLUMNS = `
  id, actor_id, area_type, label, country_code, state_code, city, zip_code,
  center_lat, center_lng, radius_miles, travel_fee_cents,
  min_eta_minutes, max_eta_minutes, is_emergency_covered,
  is_active, sort_order, notes, created_at, updated_at
`

export async function dalUpsertLocksmithServiceArea(row) {
  if (!row?.actor_id) throw new Error('actor_id required')

  const { data, error } = await vportSchema
    .from('locksmith_service_areas')
    .upsert(row, { onConflict: 'id' })
    .select(RETURN_COLUMNS)

  if (error) throw error
  return data?.[0] ?? null
}

export async function dalInsertLocksmithServiceArea(row) {
  if (!row?.actor_id) throw new Error('actor_id required')

  const { data, error } = await vportSchema
    .from('locksmith_service_areas')
    .insert([row])
    .select(RETURN_COLUMNS)

  if (error) throw error
  return data?.[0] ?? null
}

export async function dalDeleteLocksmithServiceArea(areaId) {
  if (!areaId) throw new Error('areaId required')

  const { error } = await vportSchema
    .from('locksmith_service_areas')
    .delete()
    .eq('id', areaId)

  if (error) throw error
}

export async function dalUpdateLocksmithServiceArea(areaId, updates) {
  if (!areaId) throw new Error('areaId required')

  const { data, error } = await vportSchema
    .from('locksmith_service_areas')
    .update(updates)
    .eq('id', areaId)
    .select(RETURN_COLUMNS)

  if (error) throw error
  return data?.[0] ?? null
}
