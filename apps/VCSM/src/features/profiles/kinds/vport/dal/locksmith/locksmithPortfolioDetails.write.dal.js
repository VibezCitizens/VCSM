// ============================================================
// VCSM — Locksmith Portfolio Details Write DAL
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

const RETURN_COLUMNS = `
  portfolio_item_id, job_type, property_type, lock_type, hardware_brand,
  service_mode, has_before_after, is_emergency_job, is_security_upgrade,
  estimated_duration_minutes, display_in_portfolio, notes,
  created_at, updated_at
`

export async function dalUpsertLocksmithPortfolioDetail(row) {
  if (!row?.portfolio_item_id) throw new Error('portfolio_item_id required')

  const { data, error } = await supabase
    .schema('vc')
    .from('vport_locksmith_portfolio_details')
    .upsert(row, { onConflict: 'portfolio_item_id' })
    .select(RETURN_COLUMNS)

  if (error) throw error
  return data?.[0] ?? null
}
