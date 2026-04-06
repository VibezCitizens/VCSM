// src/dal/access.read.dal.js
// ============================================================
// Identity Engine — Access DAL
// Queries: platform.user_app_access
// ============================================================

import { getSupabaseClient } from '../config.js'

const ACCESS_COLUMNS = `
  user_id,
  app_id,
  status,
  granted_at,
  revoked_at
`

/**
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.appId
 * @returns {Promise<Object|null>}
 */
export async function dalGetUserAppAccess({ userId, appId, trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({
    step: 'ACCESS_READ_START',
    status: 'start',
    dalName: 'dalGetUserAppAccess',
    fileName: 'access.read.dal.js',
    queryMode: 'limit1',
    rowCount: null,
    errorCode: null,
    errorMessage: null,
    failureMode: null,
  })

  const { data, error } = await supabase
    .schema('platform')
    .from('user_app_access')
    .select(ACCESS_COLUMNS)
    .eq('user_id', userId)
    .eq('app_id', appId)
    .order('granted_at', { ascending: false, nullsFirst: false })
    .limit(1)

  if (error) {
    trace?.report?.({
      step: 'ACCESS_READ_ERROR',
      status: 'error',
      message: error?.message,
      error,
      dalName: 'dalGetUserAppAccess',
      fileName: 'access.read.dal.js',
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
    step: 'ACCESS_READ_SUCCESS',
    status: 'success',
    dalName: 'dalGetUserAppAccess',
    fileName: 'access.read.dal.js',
    queryMode: 'limit1',
    rowCount,
    errorCode: null,
    errorMessage: null,
    failureMode: rowCount === 0 ? 'ZERO_ROWS' : null,
  })

  return data?.[0] ?? null
}
