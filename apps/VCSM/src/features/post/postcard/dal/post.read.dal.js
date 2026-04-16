import { supabase } from "@/services/supabase/supabaseClient";
import { hydrateAndReturnSummaries } from "@hydration";

/**
 * Fetch a single post by ID
 * DAL — RAW DB ROW (DETAIL READ MODEL)
 */
export async function fetchPostByIdDAL(postId) {
  if (!postId) {
    return { data: null, error: null };
  }

  const { data: row, error } = await supabase
    .schema("vc")
    .from("posts")
    .select(`
      id,
      actor_id,
      text,
      title,
      media_type,
      media_url,
      post_type,
      tags,
      created_at,
      location_text,

      post_media (
        url,
        media_type,
        sort_order
      )
    `)
    .eq("id", postId)
    .order("sort_order", { foreignTable: "post_media", ascending: true })
    .maybeSingle();

  if (error || !row) return { data: row ?? null, error };

  // Hydrate actor via engine — returns canonical summary shape
  const { rows: actorRows } = await hydrateAndReturnSummaries({ actorIds: [row.actor_id] });
  const actor = actorRows?.[0] ?? null;

  return { data: { ...row, actor }, error: null };
}
