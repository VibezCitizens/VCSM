// src/dal/account.read.dal.js
// ============================================================
// Identity Engine — Account DAL
// Queries: platform.user_app_accounts, platform.v_user_app_context
// ============================================================

import { getSupabaseClient } from '../config.js'

const ACCOUNT_COLUMNS = `
  id,
  user_id,
  app_id,
  status,
  activated_at,
  last_seen_at
`

/**
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.appId
 * @returns {Promise<Object|null>}
 */
export async function dalGetUserAppAccount({ userId, appId, trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({
    step: 'ACCOUNT_READ_START',
    status: 'start',
    dalName: 'dalGetUserAppAccount',
    fileName: 'account.read.dal.js',
    queryMode: 'limit1',
    rowCount: null,
    errorCode: null,
    errorMessage: null,
    failureMode: null,
  })

  const { data, error } = await supabase
    .schema('platform')
    .from('user_app_accounts')
    .select(ACCOUNT_COLUMNS)
    .eq('user_id', userId)
    .eq('app_id', appId)
    .order('activated_at', { ascending: false, nullsFirst: false })
    .limit(1)

  if (error) {
    trace?.report?.({
      step: 'ACCOUNT_READ_ERROR',
      status: 'error',
      message: error?.message,
      error,
      dalName: 'dalGetUserAppAccount',
      fileName: 'account.read.dal.js',
      queryMode: 'limit1',
      rowCount: null,
      errorCode: error?.code ?? null,
      errorMessage: error?.message ?? null,
      failureMode: 'THROWN_ERROR',
    })
    throw error
  }

  const rowCount = Array.isArray(data) ? data.length : 0

  trace?.report?.({
    step: 'ACCOUNT_READ_SUCCESS',
    status: 'success',
    dalName: 'dalGetUserAppAccount',
    fileName: 'account.read.dal.js',
    queryMode: 'limit1',
    rowCount,
    errorCode: null,
    errorMessage: null,
    failureMode: rowCount === 0 ? 'ZERO_ROWS' : null,
  })

  return data?.[0] ?? null
}

/**
 * Fetch via the v_user_app_context view (includes app_key, app_name).
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.appKey
 * @returns {Promise<Object|null>}
 */
export async function dalGetUserAppContextByKey({ userId, appKey, trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({
    step: 'ACCOUNT_READ_START',
    status: 'start',
    dalName: 'dalGetUserAppContextByKey',
    fileName: 'account.read.dal.js',
    queryMode: 'limit1',
    rowCount: null,
    errorCode: null,
    errorMessage: null,
    failureMode: null,
  })

  // Use .limit(1) instead of .maybeSingle() to avoid PGRST116 if legacy
  // duplicate rows exist for the same user+app. The unique constraint on
  // user_app_accounts(user_id, app_id) should prevent this, but older
  // accounts provisioned before the constraint may have duplicates.
  const { data, error } = await supabase
    .schema('platform')
    .from('v_user_app_context')
    .select(`
      user_app_account_id,
      user_id,
      app_id,
      app_key,
      app_name,
      app_account_status,
      activated_at,
      last_seen_at
    `)
    .eq('user_id', userId)
    .eq('app_key', appKey)
    .order('activated_at', { ascending: false, nullsFirst: false })
    .limit(1)

  if (error) {
    trace?.report?.({
      step: 'ACCOUNT_READ_ERROR',
      status: 'error',
      message: error?.message,
      error,
      dalName: 'dalGetUserAppContextByKey',
      fileName: 'account.read.dal.js',
      queryMode: 'limit1',
      rowCount: null,
      errorCode: error?.code ?? null,
      errorMessage: error?.message ?? null,
      failureMode: 'THROWN_ERROR',
    })
    throw error
  }

  const rowCount = Array.isArray(data) ? data.length : 0

  trace?.report?.({
    step: 'ACCOUNT_READ_SUCCESS',
    status: 'success',
    dalName: 'dalGetUserAppContextByKey',
    fileName: 'account.read.dal.js',
    queryMode: 'limit1',
    rowCount,
    errorCode: null,
    errorMessage: null,
    failureMode: rowCount === 0 ? 'ZERO_ROWS' : null,
  })

  return data?.[0] ?? null
}
