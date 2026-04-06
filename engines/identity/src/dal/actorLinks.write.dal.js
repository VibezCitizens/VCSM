// src/dal/actorLinks.write.dal.js
// ============================================================
// Identity Engine — Actor Links DAL (write)
// Tables: platform.user_app_actor_links, platform.user_app_preferences
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Set the active actor link id in user_app_preferences.
 * Uses UPDATE (not upsert) because the preferences row is created
 * by provision_vcsm_identity or create_vport RPCs.
 *
 * The upsert was causing 403 because platform.user_app_preferences
 * has no INSERT RLS policy — only SELECT and UPDATE.
 *
 * @param {Object} params
 * @param {string} params.userAppAccountId
 * @param {string} params.actorLinkId
 */
export async function dalSetActiveActorLink({ userAppAccountId, actorLinkId }) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('platform')
    .from('user_app_preferences')
    .update({
      active_actor_link_id: actorLinkId,
      last_actor_link_id: actorLinkId,
    })
    .eq('user_app_account_id', userAppAccountId)

  if (error) throw error
}
