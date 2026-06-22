import { supabase } from "@/services/supabase/supabaseClient";
import { toContainsPattern, isUuid } from "@/services/supabase/postgrestSafe";

export async function searchActorsDAL({ query, limit = 12, viewerActorId = null }) {
  const needle = (query || '').replace(/^[@#]/, '').trim();
  if (!needle) return [];

  // Only a verified UUID elevates visibility to 'all'; truthy strings or invalid IDs stay public.
  const filter = isUuid(viewerActorId) ? 'all' : 'public';

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
