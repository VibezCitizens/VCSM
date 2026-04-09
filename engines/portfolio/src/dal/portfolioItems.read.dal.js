// ============================================================
// Portfolio Engine — Portfolio Items Read DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

const ITEM_COLUMNS = `
  id, actor_id, service_id, title, description, portfolio_kind,
  visibility, cover_media_id, is_featured, is_pinned, is_active,
  is_deleted, sort_order, source_post_id, created_by_actor_id,
  published_at, created_at, updated_at, deleted_at
`

/**
 * Fetch a single portfolio item by ID.
 */
export async function dalGetPortfolioItemById({ itemId, trace = null }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('vc')
    .from('vport_portfolio_items')
    .select(ITEM_COLUMNS)
    .eq('id', itemId)
    .limit(1)

  if (error) {
    trace?.report?.({ step: 'ITEM_BY_ID_ERROR', status: 'error', error })
    throw error
  }

  return data?.[0] ?? null
}

/**
 * Fetch all active, public items for an actor (owner read — includes all visibilities).
 */
export async function dalListPortfolioItemsByActor({ actorId, limit = 50, offset = 0, trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({
    step: 'ITEMS_LIST_BY_ACTOR_START',
    status: 'start',
    dalName: 'dalListPortfolioItemsByActor',
  })

  const { data, error } = await supabase
    .schema('vc')
    .from('vport_portfolio_items')
    .select(ITEM_COLUMNS)
    .eq('actor_id', actorId)
    .eq('is_deleted', false)
    .order('is_pinned', { ascending: false })
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1)

  if (error) {
    trace?.report?.({ step: 'ITEMS_LIST_BY_ACTOR_ERROR', status: 'error', error })
    throw error
  }

  trace?.report?.({
    step: 'ITEMS_LIST_BY_ACTOR_SUCCESS',
    status: 'success',
    rowCount: data?.length ?? 0,
  })

  return data ?? []
}
