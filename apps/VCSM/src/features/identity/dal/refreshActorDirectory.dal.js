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

/**
 * Refresh a single actor's row in identity.actor_directory.
 *
 * @param {string} actorDomain — 'vc' or 'learning'
 * @param {string} actorId — the vc.actors.id (NOT profile_id, NOT vport_id)
 * @returns {Promise<{ ok: boolean, error?: Error }>}
 */
export async function refreshActorDirectoryRow(actorDomain, actorId) {
  if (!actorDomain || !actorId) {
    if (import.meta.env.DEV) {
      console.warn('[refreshActorDirectory] missing actorDomain or actorId', { actorDomain, actorId })
    }
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
      if (import.meta.env.DEV) {
        console.warn('[refreshActorDirectory] RPC failed', { actorDomain, actorId, error: error.message })
      }
      return { ok: false, error }
    }

    return { ok: true }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[refreshActorDirectory] unexpected error', { actorDomain, actorId, error: err.message })
    }
    return { ok: false, error: err }
  }
}

/**
 * Refresh a VC actor's directory row. Convenience wrapper.
 */
export async function refreshVcActorDirectory(actorId) {
  return refreshActorDirectoryRow('vc', actorId)
}
