// src/features/identity/dal/refreshActorDirectory.dal.js
// ============================================================
// Reusable helper to refresh identity.actor_directory after
// VC source-of-truth mutations (profile edit, vport edit,
// privacy toggle, actor creation, etc.)
//
// Call this AFTER a successful source write. If the refresh
// fails, the primary user operation is NOT rolled back.
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'
import { debugLoginEvent, debugLoginError } from '@debuggers/identity'

/**
 * Refresh a single actor's row in identity.actor_directory.
 *
 * @param {string} actorDomain — 'vc' or 'learning'
 * @param {string} actorId — the vc.actors.id (NOT profile_id, NOT vport_id)
 * @returns {Promise<{ ok: boolean, error?: Error }>}
 */
export async function refreshActorDirectoryRow(actorDomain, actorId) {
  if (!actorDomain || !actorId) {
    debugLoginEvent('REFRESH_ACTOR_DIRECTORY_MISSING_PARAMS', {
      phase: 'identity', status: 'warn',
      payload: { actorDomain: actorDomain ?? null, actorId: actorId ?? null },
    })
    return { ok: false, error: new Error('missing actorDomain or actorId') }
  }

  try {
    const { error } = await supabase
      .schema('identity')
      .rpc('refresh_actor_directory_row', {
        p_actor_domain: actorDomain,
        p_actor_id: actorId,
      })

    if (error) {
      debugLoginError('REFRESH_ACTOR_DIRECTORY_RPC_FAILED', error, {
        phase: 'identity',
        payload: { actorDomain, actorId: actorId?.slice(0, 8) ?? null },
      })
      return { ok: false, error }
    }

    return { ok: true }
  } catch (err) {
    debugLoginError('REFRESH_ACTOR_DIRECTORY_UNEXPECTED_ERROR', err, {
      phase: 'identity',
      payload: { actorDomain, actorId: actorId?.slice(0, 8) ?? null },
    })
    return { ok: false, error: err }
  }
}

/**
 * Refresh a VC actor's directory row. Convenience wrapper.
 */
export async function refreshVcActorDirectory(actorId) {
  return refreshActorDirectoryRow('vc', actorId)
}
