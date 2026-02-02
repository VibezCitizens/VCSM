import { supabase } from "@/services/supabase/supabaseClient";
import { resolveRealm } from "../dal/resolveRealm";
import { insertPost } from "../dal/insertPost";
import { insertPostMedia } from "../dal/insertPostMedia";
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
  const caption = (input.caption || "").trim();
  const tags = extractHashtags(caption);

  // ✅ Normalize media input (support old + new)
  const mediaUrls = Array.isArray(input.mediaUrls) ? input.mediaUrls.filter(Boolean) : [];
  const mediaTypes = Array.isArray(input.mediaTypes) ? input.mediaTypes.filter(Boolean) : [];

  // Back-compat: if old single fields exist, use them
  const legacyUrl = input.mediaUrl || "";
  const legacyType = input.mediaType || "text";

  const firstUrl = mediaUrls[0] || legacyUrl || "";
  const firstType = mediaTypes[0] || (firstUrl ? legacyType : "text");

  // 🏗️ Authoritative DB row
  const row = {
    user_id: auth.user.id,
    actor_id: identity.actorId,
    realm_id: resolveRealm(identity.isVoid),
    text: caption,
    title: null,

    // ✅ keep first media item in posts table for backwards compatibility
    media_url: firstUrl,
    media_type: firstUrl ? (firstType || "image") : "text",

    post_type: input.mode,
    tags,
    created_at: new Date().toISOString(),
  };

  // 🧱 Persistence (DAL) — must return inserted post id
  const created = await insertPost(row);
  const postId = created?.id;
  if (!postId) throw new Error("insertPost did not return post id");

  if (mediaUrls.length > 0) {
    const items = mediaUrls.map((url, idx) => ({
      url,
      media_type: (mediaTypes[idx] || "image") === "video" ? "video" : "image",
      sort_order: idx,
    }));

    try {
      await insertPostMedia(postId, items);
    } catch (e) {
      // ✅ IMPORTANT: match schema for rollback
      await supabase.schema("vc").from("posts").delete().eq("id", postId);
      throw e;
    }
  }

  return {
    actorId: identity.actorId,
    tags,
    postId,
  };
}
