import { supabase } from "@/services/supabase/supabaseClient";

export async function insertPostMedia(postId, items) {
  if (!postId) throw new Error("insertPostMedia: postId missing");
  if (!Array.isArray(items) || items.length === 0) return;

  const rows = items.map((it) => ({
    post_id: postId,
    url: it.url,
    media_type: it.media_type, // 'image' | 'video'
    sort_order: it.sort_order ?? 0,
  }));

  const { error } = await supabase.schema("vc").from("post_media").insert(rows);
  if (error) throw new Error(error.message || "Failed to insert post media");
}
