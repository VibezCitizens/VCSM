// ============================================================
// Portfolio Engine — Locksmith Portfolio Details Read DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

const LOCKSMITH_COLUMNS = `
  portfolio_item_id, job_type, property_type, lock_type, hardware_brand,
  service_mode, has_before_after, is_emergency_job, is_security_upgrade,
  estimated_duration_minutes, display_in_portfolio, notes,
  created_at, updated_at
`

/**
 * Fetch locksmith-specific details for a portfolio item.
 */
export async function dalGetLocksmithDetailsByItemId({ itemId, trace = null }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('vport')
    .from('locksmith_portfolio_details')
    .select(LOCKSMITH_COLUMNS)
    .eq('portfolio_item_id', itemId)
    .limit(1)

  if (error) {
    trace?.report?.({ step: 'LOCKSMITH_DETAILS_ERROR', status: 'error', error })
    throw error
  }

  return data?.[0] ?? null
}

/**
 * Batch fetch locksmith details for multiple items.
 */
export async function dalListLocksmithDetailsByItemIds({ itemIds, trace = null }) {
  if (!itemIds?.length) return []

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('vport')
    .from('locksmith_portfolio_details')
    .select(LOCKSMITH_COLUMNS)
    .in('portfolio_item_id', itemIds)

  if (error) {
    trace?.report?.({ step: 'LOCKSMITH_DETAILS_BATCH_ERROR', status: 'error', error })
    throw error
  }

  return data ?? []
}
