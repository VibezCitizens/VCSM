// src/features/post/dal/post.write.dal.js
import { supabase } from "@/services/supabase/supabaseClient";
import { insertPostMentionsDAL } from "@/features/post/postcard/dal/postMentions.write.dal";

// ------------------------------------------------------------
// Mentions helpers
// ------------------------------------------------------------

// Allow: letters, numbers, underscore, hyphen (your data shows hyphens like "el-papy")
function normalizeHandle(raw) {
  const h = String(raw || "").trim().toLowerCase();
  // hard sanitize (prevents weird chars breaking postgrest filters)
  const cleaned = h.replace(/[^a-z0-9_-]/g, "");
  return cleaned || null;
}

// Extract @handles from free text.
// NOTE: this only catches explicit "@handle" mentions.
// If you also support "implicit mentions" (e.g. typing "archi" without "@"),
// that must be handled by your composer selection state, not by parsing.
function extractMentionHandles(text) {
  const s = String(text || "");
  const re = /(^|[\s(])@([a-zA-Z0-9_-]{1,32})/g;

  const out = new Set();
  let m;
  while ((m = re.exec(s)) !== null) {
    const handle = normalizeHandle(m[2]);
    if (handle) out.add(handle);
  }
  return Array.from(out);
}

// Resolve handles -> actor_ids via identity.actor_directory (users + vports).
// The directory stores canonical usernames for both kinds.
async function resolveMentionActorIds(handles) {
  const hs = Array.isArray(handles) ? handles.map(normalizeHandle).filter(Boolean) : [];
  if (hs.length === 0) return [];

  const { data, error } = await supabase
    .schema("identity")
    .from("actor_directory")
    .select("actor_id")
    .in("username", hs);

  if (error) throw error;

  const actorIds = (data || []).map((r) => r?.actor_id).filter(Boolean);
  return Array.from(new Set(actorIds));
}

async function replacePostMentions(postId, actorIds) {
  if (!postId) return;

  // delete old edges
  const { error: delErr } = await supabase
    .schema("vc")
    .from("post_mentions")
    .delete()
    .eq("post_id", postId);

  if (delErr) throw delErr;

  // insert new edges (no-op if empty)
  await insertPostMentionsDAL(postId, actorIds);
}

/**
 * Edit post text (owner-only)
 * Requires vc.posts.edited_at
 */
export async function updatePostTextDAL({ actorId, postId, text }) {
  if (!actorId) throw new Error("updatePostTextDAL: actorId required");
  if (!postId) throw new Error("updatePostTextDAL: postId required");

  const { data, error } = await supabase
    .schema("vc")
    .from("posts")
    .update({
      text,
      edited_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("actor_id", actorId) // ✅ owner gate
    .select(`id, actor_id, text, edited_at`)
    .maybeSingle();

  if (error) throw error;

  // ✅ Replace mentions for this post based on new text (best-effort)
  try {
    const handles = extractMentionHandles(text);
    const mentionedActorIds = await resolveMentionActorIds(handles);
    await replacePostMentions(postId, mentionedActorIds);
  } catch (e) {
    console.warn("[updatePostTextDAL] mention persistence failed:", e);
  }

  return { data, error: null };
}

/**
 * Soft delete (owner-only)
 * Requires vc.posts.deleted_at + deleted_by_actor_id
 */
export async function softDeletePostDAL({ actorId, postId }) {
  if (!actorId) throw new Error("softDeletePostDAL: actorId required");
  if (!postId) throw new Error("softDeletePostDAL: postId required");

  return supabase
    .schema("vc")
    .from("posts")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by_actor_id: actorId,
    })
    .eq("id", postId)
    .eq("actor_id", actorId) // ✅ owner gate
    .select(`id, deleted_at, deleted_by_actor_id`)
    .maybeSingle();
}
