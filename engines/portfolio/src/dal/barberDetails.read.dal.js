// ============================================================
// Portfolio Engine — Barber Details Read DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

const BARBER_COLUMNS = `
  portfolio_item_id, haircut_style, fade_type, beard_service,
  hair_length, client_age_group, has_design, has_color, has_beard,
  notes, created_at, updated_at
`

/**
 * Fetch barber-specific details for a portfolio item.
 */
export async function dalGetBarberDetailsByItemId({ itemId, trace = null }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('vc')
    .from('vport_barber_portfolio_details')
    .select(BARBER_COLUMNS)
    .eq('portfolio_item_id', itemId)
    .limit(1)

  if (error) {
    trace?.report?.({ step: 'BARBER_DETAILS_ERROR', status: 'error', error })
    throw error
  }

  return data?.[0] ?? null
}

/**
 * Batch fetch barber details for multiple items.
 */
export async function dalListBarberDetailsByItemIds({ itemIds, trace = null }) {
  if (!itemIds?.length) return []

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('vc')
    .from('vport_barber_portfolio_details')
    .select(BARBER_COLUMNS)
    .in('portfolio_item_id', itemIds)

  if (error) {
    trace?.report?.({ step: 'BARBER_DETAILS_BATCH_ERROR', status: 'error', error })
    throw error
  }

  return data ?? []
}
