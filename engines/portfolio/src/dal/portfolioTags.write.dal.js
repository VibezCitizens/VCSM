// ============================================================
// Portfolio Engine — Portfolio Tags Write DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Insert tags for a portfolio item. Ignores duplicates.
 */
export async function dalInsertPortfolioTags({ itemId, tags, trace = null }) {
  if (!tags?.length) return []

  const supabase = getSupabaseClient()

  const rows = tags.map((tag) => ({
    portfolio_item_id: itemId,
    tag: String(tag).trim().toLowerCase(),
  }))

  const { data, error } = await supabase
    .schema('vport')
    .from('portfolio_tags')
    .upsert(rows, { onConflict: 'portfolio_item_id,tag', ignoreDuplicates: true })
    .select('portfolio_item_id, tag')

  if (error) {
    trace?.report?.({ step: 'TAGS_INSERT_ERROR', status: 'error', error })
    throw error
  }

  return data ?? []
}

/**
 * Remove specific tags from a portfolio item.
 */
export async function dalDeletePortfolioTags({ itemId, tags, trace = null }) {
  if (!tags?.length) return

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('vport')
    .from('portfolio_tags')
    .delete()
    .eq('portfolio_item_id', itemId)
    .in('tag', tags.map((t) => String(t).trim().toLowerCase()))

  if (error) {
    trace?.report?.({ step: 'TAGS_DELETE_ERROR', status: 'error', error })
    throw error
  }
}

/**
 * Replace all tags for a portfolio item.
 */
export async function dalReplacePortfolioTags({ itemId, tags, trace = null }) {
  const supabase = getSupabaseClient()

  // Delete existing
  const { error: delError } = await supabase
    .schema('vport')
    .from('portfolio_tags')
    .delete()
    .eq('portfolio_item_id', itemId)

  if (delError) {
    trace?.report?.({ step: 'TAGS_REPLACE_DELETE_ERROR', status: 'error', error: delError })
    throw delError
  }

  if (!tags?.length) return []

  return dalInsertPortfolioTags({ itemId, tags, trace })
}
