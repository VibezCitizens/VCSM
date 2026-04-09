// ============================================================
// Reviews Engine — Dimensions Read DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

const DIMENSION_COLUMNS = `
  id, target_kind, target_subtype, key, label, weight, sort_order, is_active
`

/**
 * Fetch active dimensions for a given target kind and subtype.
 *
 * @param {Object} params
 * @param {string} params.targetKind
 * @param {string} params.targetSubtype
 * @param {Object} [params.trace]
 * @returns {Promise<Object[]>}
 */
export async function dalListActiveDimensions({ targetKind, targetSubtype, trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({
    step: 'DIMENSIONS_LIST_START',
    status: 'start',
    dalName: 'dalListActiveDimensions',
  })

  const { data, error } = await supabase
    .schema('reviews')
    .from('review_dimensions')
    .select(DIMENSION_COLUMNS)
    .eq('target_kind', targetKind)
    .eq('target_subtype', targetSubtype)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    trace?.report?.({ step: 'DIMENSIONS_LIST_ERROR', status: 'error', error })
    throw error
  }

  trace?.report?.({
    step: 'DIMENSIONS_LIST_SUCCESS',
    status: 'success',
    rowCount: data?.length ?? 0,
  })

  return data ?? []
}
