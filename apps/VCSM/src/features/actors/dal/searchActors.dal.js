import { supabase } from "@/services/supabase/supabaseClient";
import { toContainsPattern } from "@/services/supabase/postgrestSafe";

export async function searchActorsDAL({ query, limit = 12, viewerActorId = null }) {
  const needle = (query || '').replace(/^[@#]/, '').trim();
  if (!needle) return [];

  // Unauthenticated callers get public-only results regardless of DB function default behavior.
  const filter = viewerActorId ? 'all' : 'public';

  const { data, error } = await supabase
    .schema('identity')
    .rpc('search_actor_directory', {
      p_viewer_domain: 'vc',
      p_viewer_actor_id: viewerActorId,
      p_query: needle,
      p_filter: filter,
      p_limit: limit,
      p_offset: 0,
    });

  if (error) throw error;

  return Array.isArray(data) ? data : [];
}
