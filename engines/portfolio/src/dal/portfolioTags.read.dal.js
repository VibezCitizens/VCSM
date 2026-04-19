// ============================================================
// Portfolio Engine — Portfolio Tags Read DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Fetch all tags for a portfolio item.
 */
export async function dalListTagsByItemId({ itemId, trace = null }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('vport')
    .from('portfolio_tags')
    .select('portfolio_item_id, tag, created_at')
    .eq('portfolio_item_id', itemId)
    .order('tag', { ascending: true })

  if (error) {
    trace?.report?.({ step: 'TAGS_LIST_ERROR', status: 'error', error })
    throw error
  }

  return data ?? []
}

/**
 * Batch fetch tags for multiple portfolio items.
 */
export async function dalListTagsByItemIds({ itemIds, trace = null }) {
  if (!itemIds?.length) return []

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('vport')
    .from('portfolio_tags')
    .select('portfolio_item_id, tag, created_at')
    .in('portfolio_item_id', itemIds)

  if (error) {
    trace?.report?.({ step: 'TAGS_BATCH_LIST_ERROR', status: 'error', error })
    throw error
  }

  return data ?? []
}
