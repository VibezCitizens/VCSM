// src/features/moderation/dal/assertModerationAccess.dal.js
// ============================================================
// Raw DB read: checks whether the current session user holds a moderation role.
// Returns a boolean — no authorization decisions here.
//
// Authority source: moderation.moderators (TICKET-MODERATION-AUTHORITY-DECOUPLE-0001)
// DB function: moderation.is_current_user_moderator()
//   → moderation.can_manage_domain('vc') [SECURITY DEFINER]
//   → moderation.moderators WHERE role IN ('moderator','admin') AND revoked_at IS NULL
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Returns true if the current session user has an authorized moderation role.
 * Resolves via moderation.is_current_user_moderator() server-side using auth.uid().
 * Returns false on any DB error — callers always get a boolean.
 */
export async function isModerationAuthorizedDAL(actorId) {
  try {
    // actorId is retained for the controller contract; authorization resolves from auth.uid().
    const { data, error } = await supabase
      .schema('moderation')
      .rpc('is_current_user_moderator')

    if (error) {
      // 42P01 = undefined_function — treat as not authorized in envs without the migration.
      if (error.code === '42P01') return false
      throw error
    }

    return data === true
  } catch {
    return false
  }
}
