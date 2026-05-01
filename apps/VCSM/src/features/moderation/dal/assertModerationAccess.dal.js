// src/features/moderation/dal/assertModerationAccess.dal.js
// ============================================================
// Authorization guard for moderation write paths.
// Checks whether an actorId holds a platform-admin or
// platform-moderator role before any enforcement action runs.
//
// Role tables checked (in order):
//   1. learning.platform_admins  — existing cross-platform admin table
//   2. moderation.moderators     — moderation-specific role table
//      (extend the query here when that table is created)
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Returns true if actorId has an authorized moderation role.
 * Returns false on any DB error so callers always get a boolean.
 */
async function _isModerationAuthorized(actorId) {
  if (!actorId) return false

  try {
    const { data, error } = await supabase
      .schema('learning')
      .from('platform_admins')
      .select('actor_id')
      .eq('actor_id', actorId)
      .limit(1)

    if (error) {
      // Table may not exist in all environments (42P01 = undefined_table).
      // Any other error should be treated as a denial, not as authorized.
      if (error.code === '42P01') return false
      throw error
    }

    return Array.isArray(data) && data.length > 0
  } catch {
    return false
  }
}

/**
 * Asserts that actorId is authorized to perform moderation actions.
 * Throws a FORBIDDEN error object if the check fails.
 * Must be called before any write in moderation enforcement controllers.
 */
export async function assertModerationAccessDAL(actorId) {
  if (!actorId) {
    const err = new Error('assertModerationAccessDAL: actorId required')
    err.code = 'FORBIDDEN'
    throw err
  }

  const authorized = await _isModerationAuthorized(actorId)

  if (!authorized) {
    const err = new Error('Forbidden: actor is not authorized to perform moderation actions')
    err.code = 'FORBIDDEN'
    throw err
  }
}
