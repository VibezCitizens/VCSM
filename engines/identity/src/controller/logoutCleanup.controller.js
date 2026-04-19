// src/controller/logoutCleanup.controller.js
// ============================================================
// Identity Engine — Logout Cleanup
// Signs out from Supabase and emits the LOGGED_OUT event.
// In-memory state cleanup is the app's responsibility.
// ============================================================

import { dalSignOut } from '../dal/session.read.dal.js'
import { emit, EVENTS } from '../events.js'
import { invalidateIdentityResultCache } from './resolveAuthenticatedContext.controller.js'

/**
 * Sign out and emit LOGGED_OUT.
 *
 * @returns {Promise<{ success: boolean }>}
 */
export async function logoutCleanup() {
  const { error } = await dalSignOut()

  if (error) {
    throw error
  }

  // Clear all cached identity results on logout
  invalidateIdentityResultCache()

  emit(EVENTS.LOGGED_OUT, {})

  return { success: true }
}
