// src/features/moderation/dal/assertModerationAccess.dal.js
// ============================================================
// Raw DB read: checks whether an actorId holds a moderation role.
// Returns a boolean — no authorization decisions here.
//
// Role tables checked (in order):
//   1. learning.platform_admins  — existing cross-platform admin table
//   2. moderation.moderators     — moderation-specific role table
//      (extend the query here when that table is created)
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Returns true if the current session user has an authorized moderation role.
 * Uses learning.is_current_user_platform_admin() which resolves via auth.uid() server-side.
 * Returns false on any DB error — callers always get a boolean.
 */
export async function isModerationAuthorizedDAL(actorId) {
  try {
    const { data, error } = await supabase
      .schema('learning')
      .rpc('is_current_user_platform_admin')

    if (error) {
      // 42P01 = undefined_table — treat as not authorized in envs without the table.
      if (error.code === '42P01') return false
      throw error
    }

    return data === true
  } catch {
    return false
  }
}
