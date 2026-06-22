// src/features/upload/dal/searchMentionSuggestions.js
import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Search mention suggestions by prefix via identity.search_actor_directory RPC.
 * Returns a unified list for users + vports.
 *
 * Output:
 * [
 *   {
 *     actor_id,
 *     kind,           // 'user' | 'vport'
 *     handle,         // canonical username (slug for vports)
 *     display_name,
 *     photo_url
 *   }
 * ]
 */
export async function searchMentionSuggestions(prefix, { limit = 8, viewerActorId = null } = {}) {
  const needle = (prefix || '').replace(/^@/, '').trim();
  if (!needle) return [];

  const p_filter = viewerActorId ? 'all' : 'public'

  const { data, error } = await supabase
    .schema('identity')
    .rpc('search_actor_directory', {
      p_viewer_domain: 'vc',
      p_viewer_actor_id: viewerActorId,
      p_query: needle,
      p_filter,
      p_limit: limit,
      p_offset: 0,
    });

  if (error) throw error;

  return (Array.isArray(data) ? data : [])
    .map((row) => {
      if (!row?.actor_id || !row?.username) return null;
      return {
        actor_id:     row.actor_id,
        kind:         row.actor_kind ?? null,
        handle:       row.username,
        display_name: row.display_name ?? null,
        photo_url:    row.avatar_url ?? null,
      };
    })
    .filter(Boolean);
}
