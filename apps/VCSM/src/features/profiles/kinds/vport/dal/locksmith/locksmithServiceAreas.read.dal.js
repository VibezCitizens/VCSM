// ============================================================
// VCSM — Locksmith Service Areas Read DAL
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

const AREA_COLUMNS = `
  id, actor_id, area_type, label, country_code, state_code, city, zip_code,
  center_lat, center_lng, radius_miles, travel_fee_cents,
  min_eta_minutes, max_eta_minutes, is_emergency_covered,
  is_active, sort_order, notes, created_at, updated_at
`

/**
 * Fetch all active service areas for a locksmith actor.
 */
export async function dalListLocksmithServiceAreas(actorId) {
  if (!actorId) return []

  const { data, error } = await supabase
    .schema('vc')
    .from('vport_locksmith_service_areas')
    .select(AREA_COLUMNS)
    .eq('actor_id', actorId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}
