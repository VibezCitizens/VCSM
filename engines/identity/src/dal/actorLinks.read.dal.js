// src/dal/actorLinks.read.dal.js
// ============================================================
// Identity Engine — Actor Links DAL (read)
// Queries: platform.user_app_actor_links
// ============================================================

import { getSupabaseClient } from '../config.js'
import { classifyMaybeSingleFailure } from '../resolveTrace.js'

const ACTOR_LINK_COLUMNS = `
  id,
  user_app_account_id,
  app_id,
  actor_source,
  actor_id,
  actor_kind,
  is_primary,
  is_switchable,
  status,
  display_name_snapshot,
  avatar_url_snapshot,
  meta
`

/**
 * Fetch all active actor links for an app account.
 *
 * @param {Object} params
 * @param {string} params.userAppAccountId
 * @returns {Promise<Object[]>}
 */
export async function dalGetActorLinksForAccount({ userAppAccountId, trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({
    step: 'ACTOR_LINKS_READ_START',
    status: 'start',
    dalName: 'dalGetActorLinksForAccount',
    fileName: 'actorLinks.read.dal.js',
    queryMode: 'array',
    rowCount: null,
    errorCode: null,
    errorMessage: null,
    failureMode: null,
  })

  const { data, error } = await supabase
    .schema('platform')
    .from('user_app_actor_links')
    .select(ACTOR_LINK_COLUMNS)
    .eq('user_app_account_id', userAppAccountId)
    .eq('status', 'active')
    .order('is_primary', { ascending: false })

  if (error) {
    trace?.report?.({
      step: 'ACTOR_LINKS_READ_ERROR',
      status: 'error',
      message: error?.message,
      error,
      dalName: 'dalGetActorLinksForAccount',
      fileName: 'actorLinks.read.dal.js',
      queryMode: 'array',
      rowCount: null,
      errorCode: error?.code ?? null,
      errorMessage: error?.message ?? null,
      failureMode: 'THROWN_ERROR',
    })
    throw error
  }

  const rowCount = Array.isArray(data) ? data.length : 0

  trace?.report?.({
    step: 'ACTOR_LINKS_READ_SUCCESS',
    status: 'success',
    dalName: 'dalGetActorLinksForAccount',
    fileName: 'actorLinks.read.dal.js',
    queryMode: 'array',
    rowCount,
    errorCode: null,
    errorMessage: null,
    failureMode: rowCount === 0 ? 'ZERO_ROWS' : null,
  })

  return data ?? []
}

/**
 * Fetch a single actor link by id.
 *
 * @param {Object} params
 * @param {string} params.actorLinkId
 * @returns {Promise<Object|null>}
 */
export async function dalGetActorLinkById({ actorLinkId, trace = null }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('platform')
    .from('user_app_actor_links')
    .select(ACTOR_LINK_COLUMNS)
    .eq('id', actorLinkId)
    .maybeSingle()

  if (error) {
    let rowCount = null
    let failureMode = 'THROWN_ERROR'

    if (error?.code === 'PGRST116') {
      const diagnosis = await classifyMaybeSingleFailure(() =>
        supabase
          .schema('platform')
          .from('user_app_actor_links')
          .select('id')
          .eq('id', actorLinkId)
          .limit(2)
      )
      rowCount = diagnosis.rowCount
      failureMode = diagnosis.failureMode
    }

    trace?.report?.({
      step: 'ACTOR_LINKS_READ_ERROR',
      status: 'error',
      message: error?.message,
      error,
      dalName: 'dalGetActorLinkById',
      fileName: 'actorLinks.read.dal.js',
      queryMode: 'maybeSingle',
      rowCount,
      errorCode: error?.code ?? null,
      errorMessage: error?.message ?? null,
      failureMode,
    })
    throw error
  }

  return data ?? null
}
