// src/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js
// ============================================================
// VCSM — Platform Bootstrap Controller
// ------------------------------------------------------------
// Single-step provisioning via SECURITY DEFINER RPC:
//   platform.provision_vcsm_identity(p_user_id, p_actor_id)
//
// The RPC atomically creates/ensures:
//   1. platform.user_app_access
//   2. platform.user_app_accounts
//   3. platform.user_app_preferences
//   4. platform.user_app_state
//   5. platform.user_app_actor_links (actor_source='vc')
//   6. vc.actors.user_app_account_id bridge
//
// No client-side table writes needed — everything is inside the RPC.
// Idempotent — safe to call on every login.
// ============================================================

import { dalProvisionVcsmIdentity } from '../dal/provision.rpc.dal.js'

/**
 * Ensure platform identity + actor link exist for a VCSM user.
 *
 * @param {Object} params
 * @param {string} params.userId - auth.users.id
 * @param {string} params.actorId - vc.actors.id
 * @returns {Promise<{ ok: boolean, userAppAccountId?: string, error?: string }>}
 */
export async function ensureVcsmPlatformBootstrap({ userId, actorId }) {
  if (!userId || !actorId) {
    return { ok: false, error: 'Missing userId or actorId' }
  }

  try {
    const userAppAccountId = await dalProvisionVcsmIdentity({ userId, actorId })

    if (!userAppAccountId) {
      return { ok: false, error: 'Provision RPC returned no account ID' }
    }

    return { ok: true, userAppAccountId }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[VCSM identity] Platform bootstrap failed (non-fatal):', error?.message ?? error)
    }
    return { ok: false, error: error?.message ?? 'Unknown error' }
  }
}
