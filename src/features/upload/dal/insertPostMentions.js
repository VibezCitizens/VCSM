import { supabase } from "@/services/supabase/supabaseClient";

export async function insertPostMentions(postId, actorIds) {
  if (!postId) throw new Error("insertPostMentions: postId missing");
  const ids = Array.isArray(actorIds) ? actorIds.filter(Boolean) : [];
  if (ids.length === 0) return;

  const rows = ids.map((mentioned_actor_id) => ({
    post_id: postId,
    mentioned_actor_id,
  }));

  const { error } = await supabase.schema("vc").from("post_mentions").insert(rows);
  if (error) throw new Error(error.message || "Failed to insert post mentions");
}
