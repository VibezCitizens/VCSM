// src/dal/roles.read.dal.js
// ============================================================
// Identity Engine — Roles DAL
// Queries: platform.user_app_account_roles, platform.app_roles,
//          platform.role_capabilities, platform.capabilities
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Fetch all active role keys assigned to an app account.
 *
 * Joins user_app_account_roles → app_roles to get keys.
 * Filters out expired grants and inactive roles.
 *
 * @param {Object} params
 * @param {string} params.userAppAccountId
 * @returns {Promise<string[]>} role keys
 */
export async function dalGetRoleKeysForAccount({ userAppAccountId }) {
  const supabase = getSupabaseClient()

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .schema('platform')
    .from('user_app_account_roles')
    .select(`
      app_roles (
        key,
        is_active
      ),
      expires_at
    `)
    .eq('user_app_account_id', userAppAccountId)
    .or(`expires_at.is.null,expires_at.gt.${now}`)

  if (error) throw error

  return (data ?? [])
    .filter((r) => r.app_roles?.is_active)
    .map((r) => r.app_roles.key)
}

/**
 * Fetch all role_id rows for an app account.
 * Used internally by capabilityService to look up role_capabilities.
 *
 * @param {Object} params
 * @param {string} params.userAppAccountId
 * @returns {Promise<string[]>} role ids
 */
export async function dalGetRoleIdsForAccount({ userAppAccountId }) {
  const supabase = getSupabaseClient()

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .schema('platform')
    .from('user_app_account_roles')
    .select('role_id, expires_at')
    .eq('user_app_account_id', userAppAccountId)
    .or(`expires_at.is.null,expires_at.gt.${now}`)

  if (error) throw error

  return (data ?? []).map((r) => r.role_id)
}

/**
 * Fetch capability keys granted via roles.
 *
 * @param {Object} params
 * @param {string[]} params.roleIds
 * @returns {Promise<string[]>} capability keys
 */
export async function dalGetCapabilityKeysByRoleIds({ roleIds }) {
  if (!roleIds?.length) return []

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('platform')
    .from('role_capabilities')
    .select(`
      capabilities (
        key,
        is_active
      )
    `)
    .in('role_id', roleIds)

  if (error) throw error

  return (data ?? [])
    .filter((r) => r.capabilities?.is_active)
    .map((r) => r.capabilities.key)
}
