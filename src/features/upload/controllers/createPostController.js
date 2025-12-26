import { supabase } from "@/services/supabase/supabaseClient";
import { resolveRealm } from "../dal/resolveRealm";
import { insertPost } from "../dal/insertPost";
import { extractHashtags } from "../lib/extractHashtags";

/**
 * Controller: Create Post
 * Owns all meaning, authority, and orchestration
 */
export async function createPostController({ identity, input }) {
  if (!identity?.actorId) {
    throw new Error("No actor identity");
  }

  // 🔐 Auth check (controller authority)
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    throw new Error("Not authenticated");
  }

  // 🧠 Domain meaning
  const caption = input.caption.trim();
  const tags = extractHashtags(caption);

  // 🏗️ Authoritative DB row
  const row = {
    user_id: auth.user.id,                 // auth / RLS anchor
    actor_id: identity.actorId,            // author
    realm_id: resolveRealm(identity.isVoid),
    text: caption,
    title: null,
    media_url: input.mediaUrl || "",
    media_type: input.mediaType || "text",
    post_type: input.mode,
    tags,                                  // ✅ FIX: persist hashtags
    created_at: new Date().toISOString(),
  };

  // 🧱 Persistence (DAL)
  await insertPost(row);

  // Optional domain result
  return {
    actorId: identity.actorId,
    tags,
  };
}
