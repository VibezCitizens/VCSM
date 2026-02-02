import { supabase } from "@/services/supabase/supabaseClient";
import { readPostMediaByPostIdsDAL } from "./readPostMediaByPostIds.dal";

export async function readActorPostsDAL(actorId) {
  const { data, error } = await supabase
    .schema("vc")
    .from("posts")
    .select(`
      id,
      actor_id,
      text,
      title,
      media_url,
      media_type,
      created_at,
      edited_at,
      deleted_at,
      deleted_by_actor_id
    `)
    .eq("actor_id", actorId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  if (!rows.length) return [];

  // ✅ hydrate multi-media from vc.post_media
  const postIds = rows.map((r) => r.id).filter(Boolean);
  const mediaMap = await readPostMediaByPostIdsDAL(postIds);

  return rows.map((r) => {
    const multi = mediaMap.get(r.id) || [];

    // legacy fallback (single media_url)
    const legacy =
      r.media_url && (r.media_type === "image" || r.media_type === "video")
        ? [{ type: r.media_type, url: r.media_url, sort_order: 0 }]
        : [];

    return {
      ...r,
      media: multi.length ? multi : legacy, // ✅ NEW FIELD
    };
  });
}
