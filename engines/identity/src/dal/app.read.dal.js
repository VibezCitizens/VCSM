// src/dal/app.read.dal.js
// ============================================================
// Identity Engine — App DAL
// Queries: platform.apps
// ============================================================

import { getSupabaseClient } from '../config.js'
import { classifyMaybeSingleFailure } from '../resolveTrace.js'

const APP_COLUMNS = 'id, key, name, is_active, created_at'

/**
 * @param {Object} params
 * @param {string} params.appKey
 * @returns {Promise<Object|null>}
 */
export async function dalGetAppByKey({ appKey, trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({
    step: 'APP_READ_START',
    status: 'start',
    dalName: 'dalGetAppByKey',
    fileName: 'app.read.dal.js',
    queryMode: 'maybeSingle',
    rowCount: null,
    errorCode: null,
    errorMessage: null,
    failureMode: null,
  })

  const { data, error } = await supabase
    .schema('platform')
    .from('apps')
    .select(APP_COLUMNS)
    .eq('key', appKey)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    let rowCount = null
    let failureMode = 'THROWN_ERROR'

    if (error?.code === 'PGRST116') {
      const diagnosis = await classifyMaybeSingleFailure(() =>
        supabase
          .schema('platform')
          .from('apps')
          .select('id')
          .eq('key', appKey)
          .eq('is_active', true)
          .limit(2)
      )
      rowCount = diagnosis.rowCount
      failureMode = diagnosis.failureMode
    }

    trace?.report?.({
      step: 'APP_READ_ERROR',
      status: 'error',
      message: error?.message,
      error,
      dalName: 'dalGetAppByKey',
      fileName: 'app.read.dal.js',
      queryMode: 'maybeSingle',
      rowCount,
      errorCode: error?.code ?? null,
      errorMessage: error?.message ?? null,
      failureMode,
    })
    throw error
  }

  trace?.report?.({
    step: 'APP_READ_SUCCESS',
    status: 'success',
    dalName: 'dalGetAppByKey',
    fileName: 'app.read.dal.js',
    queryMode: 'maybeSingle',
    rowCount: data ? 1 : 0,
    errorCode: null,
    errorMessage: null,
    failureMode: data ? null : 'NULL_RESULT',
  })

  return data ?? null
}
