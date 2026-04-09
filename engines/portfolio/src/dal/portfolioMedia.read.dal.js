// ============================================================
// Portfolio Engine — Portfolio Media Read DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

const MEDIA_COLUMNS = `
  id, portfolio_item_id, actor_id, url, media_type, media_role,
  alt_text, width, height, duration_seconds, sort_order, is_active,
  created_at, updated_at
`

/**
 * Fetch all active media for a portfolio item.
 */
export async function dalListMediaByItemId({ itemId, trace = null }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('vc')
    .from('vport_portfolio_media')
    .select(MEDIA_COLUMNS)
    .eq('portfolio_item_id', itemId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    trace?.report?.({ step: 'MEDIA_LIST_ERROR', status: 'error', error })
    throw error
  }

  return data ?? []
}

/**
 * Batch fetch media for multiple portfolio item IDs.
 */
export async function dalListMediaByItemIds({ itemIds, trace = null }) {
  if (!itemIds?.length) return []

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('vc')
    .from('vport_portfolio_media')
    .select(MEDIA_COLUMNS)
    .in('portfolio_item_id', itemIds)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    trace?.report?.({ step: 'MEDIA_BATCH_LIST_ERROR', status: 'error', error })
    throw error
  }

  return data ?? []
}
