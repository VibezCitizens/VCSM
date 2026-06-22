// ============================================================
// Portfolio Engine — Portfolio Items Read DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

const ITEM_COLUMNS = `
  id, profile_id, service_id, title, description, portfolio_kind,
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
    .schema('vport')
    .from('portfolio_items')
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
 * Fetch all active, public items for a vport profile.
 */
export async function dalListPortfolioItemsByProfileId({ profileId, limit = 50, offset = 0, publicOnly = false, trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({
    step: 'ITEMS_LIST_BY_PROFILE_START',
    status: 'start',
    dalName: 'dalListPortfolioItemsByProfileId',
  })

  let query = supabase
    .schema('vport')
    .from('portfolio_items')
    .select(ITEM_COLUMNS)
    .eq('profile_id', profileId)
    .eq('is_deleted', false)

  if (publicOnly) {
    query = query.eq('visibility', 'public').eq('is_active', true)
  }

  const { data, error } = await query
    .order('is_pinned', { ascending: false })
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1)

  if (error) {
    trace?.report?.({ step: 'ITEMS_LIST_BY_PROFILE_ERROR', status: 'error', error })
    throw error
  }

  trace?.report?.({
    step: 'ITEMS_LIST_BY_PROFILE_SUCCESS',
    status: 'success',
    rowCount: data?.length ?? 0,
  })

  return data ?? []
}

/**
 * Resolve the vport profile_id for a given actor_id.
 * Returns null if no profile exists for the actor.
 */
export async function dalGetProfileIdByActorId({ actorId, trace = null }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('vport')
    .from('profiles')
    .select('id')
    .eq('actor_id', actorId)
    .limit(1)

  if (error) {
    trace?.report?.({ step: 'PROFILE_ID_LOOKUP_ERROR', status: 'error', error })
    throw error
  }

  return data?.[0]?.id ?? null
}
