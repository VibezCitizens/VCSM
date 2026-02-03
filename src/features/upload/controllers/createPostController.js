// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\upload\controllers\createPostController.js
import { supabase } from "@/services/supabase/supabaseClient";
import { resolveRealm } from "../model/resolveRealm";
import { insertPost } from "../dal/insertPost";
import { insertPostMedia } from "../dal/insertPostMedia";
import { extractHashtags } from "../lib/extractHashtags";

// ✅ mentions pipeline
import { extractMentions } from "../lib/extractMentions";
import { findActorsByHandles } from "../dal/findActorsByHandles";
import { insertPostMentions } from "../dal/insertPostMentions";

const MAX_VIBES_PHOTOS = 10;

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

  // ✅ NEW: Prefer resolved mentions from UI (works even if caption has no "@")
  // expected shape: [{ handle, actorId, kind, displayName, avatarUrl }, ...]
  const mentionsResolved = Array.isArray(input?.mentionsResolved)
    ? input.mentionsResolved
    : [];

  const mentionedActorIdsFromUI = [
    ...new Set(mentionsResolved.map((m) => m?.actorId).filter(Boolean)),
  ];

  // ✅ BACKUP: If UI didn't send actorIds, fall back to parsing caption "@handles"
  // (this will return [] if you removed "@" from caption, which is fine)
  const mentionHandles = extractMentions(caption); // ["architect", ...]

  // ✅ Normalize media input (support old + new)
  const mediaUrls = Array.isArray(input?.mediaUrls)
    ? input.mediaUrls.filter(Boolean)
    : [];
  const mediaTypes = Array.isArray(input?.mediaTypes)
    ? input.mediaTypes.filter(Boolean)
    : [];

  // ✅ Authority rule: VIBES max 10
  if ((input.mode === "post" || !input.mode) && mediaUrls.length > MAX_VIBES_PHOTOS) {
    throw new Error(`VIBES: max ${MAX_VIBES_PHOTOS} photos per post.`);
  }

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

    // ✅ location (text-only)
    location_text: (input.locationText || "").trim() || null,
  };

  // 🧱 Persistence (DAL) — must return inserted post id
  const created = await insertPost(row);
  const postId = created?.id;
  if (!postId) throw new Error("insertPost did not return post id");

  // ✅ Multi-media rows
  if (mediaUrls.length > 0) {
    const items = mediaUrls.map((url, idx) => ({
      url,
      media_type: (mediaTypes[idx] || "image") === "video" ? "video" : "image",
      sort_order: idx,
    }));

    try {
      await insertPostMedia(postId, items);
    } catch (e) {
      // rollback (controller allowed to call supabase)
      await supabase.schema("vc").from("posts").delete().eq("id", postId);
      throw e;
    }
  }

  // ✅ Mentions rows
  // Priority:
  // 1) UI resolved actorIds (works with no "@")
  // 2) fallback: resolve from caption handles (old behavior)
  try {
    if (mentionedActorIdsFromUI.length > 0) {
      await insertPostMentions(postId, mentionedActorIdsFromUI);
    } else if (mentionHandles.length > 0) {
      const resolved = await findActorsByHandles(mentionHandles);
      const mentionedActorIds = [
        ...new Set((resolved || []).map((r) => r.actor_id).filter(Boolean)),
      ];
      await insertPostMentions(postId, mentionedActorIds);
    }
  } catch (e) {
    // recommend: don't fail posting if mentions fail
    console.warn("[createPostController] mention insert failed:", e);
  }

  return {
    actorId: identity.actorId,
    tags,
    postId,
  };
}
