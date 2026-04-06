// src/dal/state.write.dal.js
// ============================================================
// Identity Engine — App State DAL (write)
// Table: platform.user_app_state
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Record a login event — sets first_login_at if null, always updates last_login_at.
 *
 * @param {Object} params
 * @param {string} params.userAppAccountId
 * @param {boolean} params.isFirstLogin
 */
export async function dalRecordLogin({ userAppAccountId, isFirstLogin }) {
  const supabase = getSupabaseClient()

  const patch = { last_login_at: new Date().toISOString() }
  if (isFirstLogin) patch.first_login_at = patch.last_login_at

  const { error } = await supabase
    .schema('platform')
    .from('user_app_state')
    .update(patch)
    .eq('user_app_account_id', userAppAccountId)

  if (error) throw error
}

/**
 * Update the last destination key after navigation.
 *
 * @param {Object} params
 * @param {string} params.userAppAccountId
 * @param {string} params.destinationKey
 */
/**
 * Finalize account state after bootstrap/self-heal.
 * Sets onboarding complete, login timestamps, and last actor link.
 *
 * @param {Object} params
 * @param {string} params.userAppAccountId
 * @param {string} params.actorLinkId
 */
export async function dalFinalizeAccountState({ userAppAccountId, actorLinkId }) {
  const supabase = getSupabaseClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .schema('platform')
    .from('user_app_state')
    .update({
      onboarding_status: 'completed',
      account_status: 'active',
      requires_onboarding: false,
      requires_actor_selection: false,
      last_actor_link_id: actorLinkId,
      last_login_at: now,
      // first_login_at: only set if null — handled via raw SQL or separate check
    })
    .eq('user_app_account_id', userAppAccountId)

  if (error) throw error

  // Set first_login_at only if null (preserve existing)
  await supabase
    .schema('platform')
    .from('user_app_state')
    .update({ first_login_at: now })
    .eq('user_app_account_id', userAppAccountId)
    .is('first_login_at', null)
}

export async function dalUpdateLastDestination({ userAppAccountId, destinationKey }) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('platform')
    .from('user_app_state')
    .update({ last_destination_key: destinationKey })
    .eq('user_app_account_id', userAppAccountId)

  if (error) throw error
}
