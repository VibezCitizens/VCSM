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
      payload,
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
    .is("deleted_at", null)
    .order("sort_order", { foreignTable: "post_media", ascending: true })
    .maybeSingle();

  if (error || !row) return { data: row ?? null, error };

  // Hydrate actor via engine — returns canonical summary shape
  const { rows: actorRows } = await hydrateAndReturnSummaries({ actorIds: [row.actor_id] });
  const actor = actorRows?.[0] ?? null;

  return { data: { ...row, actor }, error: null };
}

/**
 * Lightweight existence check — no hydration, no joins.
 * Returns true only if the post exists and has not been soft-deleted.
 */
export async function checkPostExistsDAL(postId) {
  if (!postId) return false;
  const { data } = await supabase
    .schema("vc")
    .from("posts")
    .select("id")
    .eq("id", postId)
    .is("deleted_at", null)
    .maybeSingle();
  return Boolean(data);
}
