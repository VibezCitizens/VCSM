// src/dal/capabilities.read.dal.js
// ============================================================
// Identity Engine — User Capabilities DAL
// Queries: platform.user_capabilities (direct account-level overrides)
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Fetch direct capability overrides for an app account.
 * Returns both granted and revoked rows so the service can apply them.
 *
 * @param {Object} params
 * @param {string} params.userAppAccountId
 * @returns {Promise<Array<{ key: string, status: 'granted'|'revoked'|'pending' }>>}
 */
export async function dalGetDirectCapabilitiesForAccount({ userAppAccountId }) {
  const supabase = getSupabaseClient()

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .schema('platform')
    .from('user_capabilities')
    .select(`
      status,
      expires_at,
      capabilities (
        key,
        is_active
      )
    `)
    .eq('user_app_account_id', userAppAccountId)
    .or(`expires_at.is.null,expires_at.gt.${now}`)

  if (error) throw error

  return (data ?? [])
    .filter((r) => r.capabilities?.is_active)
    .map((r) => ({ key: r.capabilities.key, status: r.status }))
}
