// src/dal/session.read.dal.js
// ============================================================
// Identity Engine — Session DAL
// Thin wrappers around supabase.auth.* — no transformation.
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Get the current authenticated user via network verification.
 * Uses getUser() instead of getSession() to avoid stale cached sessions
 * during login/logout transitions.
 *
 * @returns {Promise<{ data: { user }, error }>}
 */
export async function dalGetCurrentUser() {
  const supabase = getSupabaseClient()
  return supabase.auth.getUser()
}

/**
 * Get the cached session (for non-critical reads only).
 * WARNING: Can return stale data during auth transitions.
 * Prefer dalGetCurrentUser() for identity resolution.
 */
export async function dalGetSession() {
  const supabase = getSupabaseClient()
  return supabase.auth.getSession()
}

export async function dalSignOut() {
  const supabase = getSupabaseClient()
  return supabase.auth.signOut()
}

/**
 * Subscribe to auth state changes.
 * @param {Function} handler - (event, session) => void
 * @returns {{ data: { subscription } }}
 */
export function dalOnAuthStateChange(handler) {
  const supabase = getSupabaseClient()
  return supabase.auth.onAuthStateChange(handler)
}
