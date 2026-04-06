// src/dal/preferences.read.dal.js
// ============================================================
// Identity Engine — Preferences DAL
// Queries: platform.user_app_preferences
// ============================================================

import { getSupabaseClient } from '../config.js'
import { classifyMaybeSingleFailure } from '../resolveTrace.js'

const PREFERENCES_COLUMNS = `
  user_app_account_id,
  active_actor_link_id,
  last_actor_link_id,
  theme,
  locale,
  timezone
`

/**
 * @param {Object} params
 * @param {string} params.userAppAccountId
 * @returns {Promise<Object|null>}
 */
export async function dalGetPreferencesForAccount({ userAppAccountId, trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({
    step: 'PREFS_READ_START',
    status: 'start',
    dalName: 'dalGetPreferencesForAccount',
    fileName: 'preferences.read.dal.js',
    queryMode: 'maybeSingle',
    rowCount: null,
    errorCode: null,
    errorMessage: null,
    failureMode: null,
  })

  const { data, error } = await supabase
    .schema('platform')
    .from('user_app_preferences')
    .select(PREFERENCES_COLUMNS)
    .eq('user_app_account_id', userAppAccountId)
    .maybeSingle()

  if (error) {
    let rowCount = null
    let failureMode = 'THROWN_ERROR'

    if (error?.code === 'PGRST116') {
      const diagnosis = await classifyMaybeSingleFailure(() =>
        supabase
          .schema('platform')
          .from('user_app_preferences')
          .select('user_app_account_id')
          .eq('user_app_account_id', userAppAccountId)
          .limit(2)
      )
      rowCount = diagnosis.rowCount
      failureMode = diagnosis.failureMode
    }

    trace?.report?.({
      step: 'PREFS_READ_ERROR',
      status: 'error',
      message: error?.message,
      error,
      dalName: 'dalGetPreferencesForAccount',
      fileName: 'preferences.read.dal.js',
      queryMode: 'maybeSingle',
      rowCount,
      errorCode: error?.code ?? null,
      errorMessage: error?.message ?? null,
      failureMode,
    })
    throw error
  }

  trace?.report?.({
    step: 'PREFS_READ_SUCCESS',
    status: 'success',
    dalName: 'dalGetPreferencesForAccount',
    fileName: 'preferences.read.dal.js',
    queryMode: 'maybeSingle',
    rowCount: data ? 1 : 0,
    errorCode: null,
    errorMessage: null,
    failureMode: data ? null : 'NULL_RESULT',
  })

  return data ?? null
}
