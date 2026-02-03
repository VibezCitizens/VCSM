import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Fetch a single post by ID
 * DAL — RAW DB ROW (DETAIL READ MODEL)
 */
export async function fetchPostByIdDAL(postId) {
  if (!postId) {
    return { data: null, error: null };
  }

  return supabase
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
      ),

      actor:actor_presentation!posts_actor_id_fkey (
        actor_id,
        kind,
        display_name,
        username,
        photo_url,
        vport_name,
        vport_slug,
        vport_avatar_url,
        vport_banner_url
      )
    `)
    .eq("id", postId)
    .order("sort_order", { foreignTable: "post_media", ascending: true })
    .maybeSingle();
}
