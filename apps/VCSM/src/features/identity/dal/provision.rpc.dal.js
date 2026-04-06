// src/features/identity/dal/provision.rpc.dal.js
// ============================================================
// VCSM — Platform Provisioning RPC DAL
// ------------------------------------------------------------
// Calls: platform.provision_vcsm_identity(p_user_id, p_actor_id) → uuid
//
// Atomically creates/ensures (SECURITY DEFINER):
//   1. platform.user_app_access
//   2. platform.user_app_accounts
//   3. platform.user_app_preferences
//   4. platform.user_app_state
//   5. platform.user_app_actor_links (actor_source='vc')
//   6. vc.actors.user_app_account_id bridge
//
// Returns the user_app_account_id.
// Idempotent — safe to call on every login.
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Provision platform identity + actor link for a VCSM user.
 *
 * @param {Object} params
 * @param {string} params.userId - auth.users.id
 * @param {string} params.actorId - vc.actors.id
 * @returns {Promise<string>} user_app_account_id (uuid)
 */
export async function dalProvisionVcsmIdentity({ userId, actorId }) {
  if (!userId) throw new Error('[dalProvisionVcsmIdentity] userId is required')
  if (!actorId) throw new Error('[dalProvisionVcsmIdentity] actorId is required')

  const { data, error } = await supabase
    .schema('platform')
    .rpc('provision_vcsm_identity', {
      p_user_id: userId,
      p_actor_id: actorId,
    })

  if (error) throw error

  return data
}
