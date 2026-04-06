// src/dal/state.read.dal.js
// ============================================================
// Identity Engine — App State DAL (read)
// Queries: platform.user_app_state
// ============================================================

import { getSupabaseClient } from '../config.js'
import { classifyMaybeSingleFailure } from '../resolveTrace.js'

const STATE_COLUMNS = `
  user_app_account_id,
  onboarding_status,
  account_status,
  default_destination_key,
  last_destination_key,
  last_actor_link_id,
  requires_actor_selection,
  requires_onboarding,
  first_login_at,
  last_login_at,
  suspended_reason,
  suspended_until
`

/**
 * @param {Object} params
 * @param {string} params.userAppAccountId
 * @returns {Promise<Object|null>}
 */
export async function dalGetStateForAccount({ userAppAccountId, trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({
    step: 'STATE_READ_START',
    status: 'start',
    dalName: 'dalGetStateForAccount',
    fileName: 'state.read.dal.js',
    queryMode: 'maybeSingle',
    rowCount: null,
    errorCode: null,
    errorMessage: null,
    failureMode: null,
  })

  const { data, error } = await supabase
    .schema('platform')
    .from('user_app_state')
    .select(STATE_COLUMNS)
    .eq('user_app_account_id', userAppAccountId)
    .maybeSingle()

  if (error) {
    let rowCount = null
    let failureMode = 'THROWN_ERROR'

    if (error?.code === 'PGRST116') {
      const diagnosis = await classifyMaybeSingleFailure(() =>
        supabase
          .schema('platform')
          .from('user_app_state')
          .select('user_app_account_id')
          .eq('user_app_account_id', userAppAccountId)
          .limit(2)
      )
      rowCount = diagnosis.rowCount
      failureMode = diagnosis.failureMode
    }

    trace?.report?.({
      step: 'STATE_READ_ERROR',
      status: 'error',
      message: error?.message,
      error,
      dalName: 'dalGetStateForAccount',
      fileName: 'state.read.dal.js',
      queryMode: 'maybeSingle',
      rowCount,
      errorCode: error?.code ?? null,
      errorMessage: error?.message ?? null,
      failureMode,
    })
    throw error
  }

  trace?.report?.({
    step: 'STATE_READ_SUCCESS',
    status: 'success',
    dalName: 'dalGetStateForAccount',
    fileName: 'state.read.dal.js',
    queryMode: 'maybeSingle',
    rowCount: data ? 1 : 0,
    errorCode: null,
    errorMessage: null,
    failureMode: data ? null : 'NULL_RESULT',
  })

  return data ?? null
}
