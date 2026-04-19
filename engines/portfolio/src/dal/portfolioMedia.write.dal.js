// ============================================================
// Portfolio Engine — Portfolio Media Write DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

const MEDIA_RETURN_COLUMNS = `
  id, portfolio_item_id, profile_id, url, media_type, media_role,
  alt_text, width, height, duration_seconds, sort_order, is_active,
  created_at, updated_at
`

/**
 * Insert a media row for a portfolio item.
 */
export async function dalInsertPortfolioMedia({ portfolioItemId, profileId, url, mediaType, mediaRole, altText, width, height, durationSeconds, sortOrder, trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({ step: 'MEDIA_INSERT_START', status: 'start' })

  const { data, error } = await supabase
    .schema('vport')
    .from('portfolio_media')
    .insert([{
      portfolio_item_id: portfolioItemId,
      profile_id: profileId,
      url,
      media_type: mediaType ?? 'image',
      media_role: mediaRole ?? 'result',
      alt_text: altText ?? '',
      width: width ?? null,
      height: height ?? null,
      duration_seconds: durationSeconds ?? null,
      sort_order: sortOrder ?? 0,
    }])
    .select(MEDIA_RETURN_COLUMNS)

  if (error) {
    trace?.report?.({ step: 'MEDIA_INSERT_ERROR', status: 'error', error })
    throw error
  }

  trace?.report?.({ step: 'MEDIA_INSERT_SUCCESS', status: 'success' })
  return data?.[0] ?? null
}

/**
 * Remove a media row (hard delete — RLS enforces ownership).
 */
export async function dalDeletePortfolioMedia({ mediaId, trace = null }) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('vport')
    .from('portfolio_media')
    .delete()
    .eq('id', mediaId)

  if (error) {
    trace?.report?.({ step: 'MEDIA_DELETE_ERROR', status: 'error', error })
    throw error
  }
}
