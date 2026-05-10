import { supabase } from "@/services/supabase/supabaseClient";
import { insertPost } from "@/features/upload/dal/insertPost.dal";

export async function createSystemPost({ actorId, text, post_type, realm_id, location_text = null, media_url = null }) {
  if (!actorId) throw new Error("createSystemPost: actorId required");
  if (!text) throw new Error("createSystemPost: text required");
  if (!post_type) throw new Error("createSystemPost: post_type required");
  if (!realm_id) throw new Error("createSystemPost: realm_id required");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) throw new Error("createSystemPost: not authenticated");

  return insertPost({
    actor_id: actorId,
    user_id: user.id,
    text,
    title: null,
    media_url: media_url || "",
    media_type: media_url ? "image" : "text",
    post_type,
    tags: [],
    created_at: new Date().toISOString(),
    realm_id,
    location_text: location_text || null,
  });
}
