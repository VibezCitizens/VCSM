// src/services/sessionService.js
// ============================================================
// Identity Engine — Session Service
// Resolves the current authenticated user via network verification.
//
// Uses getUser() (network call) instead of getSession() (cached).
// This prevents stale session data from causing the engine to
// resolve for the wrong user during login/logout transitions.
// ============================================================

import { dalGetCurrentUser } from '../dal/session.read.dal.js'

/**
 * Resolve the authenticated userId from the current Supabase session.
 * Performs a network-verified check (not cached).
 *
 * @returns {Promise<string|null>} userId (auth.uid()), or null if unauthenticated
 */
export async function resolveSessionUser() {
  const { data, error } = await dalGetCurrentUser()

  if (error) throw error

  return data?.user?.id ?? null
}
