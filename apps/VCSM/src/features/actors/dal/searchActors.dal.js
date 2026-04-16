import { supabase } from "@/services/supabase/supabaseClient";
import { toContainsPattern } from "@/services/supabase/postgrestSafe";

export async function searchActorsDAL({ query, limit = 12, viewerActorId = null }) {
  const needle = (query || '').replace(/^[@#]/, '').trim();
  if (!needle) return [];

  const { data, error } = await supabase
    .schema('identity')
    .rpc('search_actor_directory', {
      p_viewer_domain: 'vc',
      p_viewer_actor_id: viewerActorId,
      p_query: needle,
      p_filter: 'all',
      p_limit: limit,
      p_offset: 0,
    });

  if (error) throw error;

  return (Array.isArray(data) ? data : []).map((row) => ({
    actor_id:        row.actor_id,
    kind:            row.actor_kind ?? null,
    display_name:    row.display_name ?? null,
    username:        row.username ?? null,
    photo_url:       row.avatar_url ?? null,
    vport_name:      row.actor_kind === 'vport' ? row.display_name ?? null : null,
    vport_slug:      row.actor_kind === 'vport' ? row.username ?? null : null,
    vport_avatar_url: row.actor_kind === 'vport' ? row.avatar_url ?? null : null,
  }));
}
