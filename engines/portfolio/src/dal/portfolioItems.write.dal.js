// ============================================================
// Portfolio Engine — Portfolio Items Write DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

const ITEM_RETURN_COLUMNS = `
  id, profile_id, service_id, title, description, portfolio_kind,
  visibility, cover_media_id, is_featured, is_pinned, is_active,
  sort_order, source_post_id, created_by_actor_id,
  published_at, created_at, updated_at
`

/**
 * Insert a new portfolio item.
 */
export async function dalInsertPortfolioItem({ profileId, title, description, portfolioKind, serviceId, visibility, sourcePostId, createdByActorId, trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({ step: 'ITEM_INSERT_START', status: 'start' })

  const { data, error } = await supabase
    .schema('vport')
    .from('portfolio_items')
    .insert([{
      profile_id: profileId,
      title: title ?? '',
      description: description ?? '',
      portfolio_kind: portfolioKind ?? 'work',
      service_id: serviceId ?? null,
      visibility: visibility ?? 'public',
      source_post_id: sourcePostId ?? null,
      created_by_actor_id: createdByActorId ?? null,
      published_at: new Date().toISOString(),
    }])
    .select(ITEM_RETURN_COLUMNS)

  if (error) {
    trace?.report?.({ step: 'ITEM_INSERT_ERROR', status: 'error', error })
    throw error
  }

  trace?.report?.({ step: 'ITEM_INSERT_SUCCESS', status: 'success' })
  return data?.[0] ?? null
}

/**
 * Update a portfolio item.
 */
export async function dalUpdatePortfolioItem({ itemId, callerProfileId, updates, trace = null }) {
  if (!callerProfileId) throw new Error('[dalUpdatePortfolioItem] callerProfileId required')
  const supabase = getSupabaseClient()

  trace?.report?.({ step: 'ITEM_UPDATE_START', status: 'start' })

  const row = {}
  if (updates.title !== undefined) row.title = updates.title
  if (updates.description !== undefined) row.description = updates.description
  if (updates.portfolioKind !== undefined) row.portfolio_kind = updates.portfolioKind
  if (updates.serviceId !== undefined) row.service_id = updates.serviceId
  if (updates.visibility !== undefined) row.visibility = updates.visibility
  if (updates.isFeatured !== undefined) row.is_featured = updates.isFeatured
  if (updates.isPinned !== undefined) row.is_pinned = updates.isPinned
  if (updates.sortOrder !== undefined) row.sort_order = updates.sortOrder

  const { data, error } = await supabase
    .schema('vport')
    .from('portfolio_items')
    .update(row)
    .eq('id', itemId)
    .eq('profile_id', callerProfileId)
    .select(ITEM_RETURN_COLUMNS)

  if (error) {
    trace?.report?.({ step: 'ITEM_UPDATE_ERROR', status: 'error', error })
    throw error
  }

  trace?.report?.({ step: 'ITEM_UPDATE_SUCCESS', status: 'success' })
  return data?.[0] ?? null
}

/**
 * Soft-delete a portfolio item.
 */
export async function dalSoftDeletePortfolioItem({ itemId, callerProfileId, trace = null }) {
  if (!callerProfileId) throw new Error('[dalSoftDeletePortfolioItem] callerProfileId required')
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('vport')
    .from('portfolio_items')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .eq('profile_id', callerProfileId)
    .select(ITEM_RETURN_COLUMNS)

  if (error) {
    trace?.report?.({ step: 'ITEM_DELETE_ERROR', status: 'error', error })
    throw error
  }

  return data?.[0] ?? null
}
