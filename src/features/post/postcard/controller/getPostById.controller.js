// src/features/post/postcard/controller/getPostById.controller.js
// ============================================================
// Get Post By ID Controller
// ------------------------------------------------------------
// - Read-only
// - Actor-based (ACTOR PRESENTATION)
// - DAL → domain-safe mapping
// ============================================================

import { fetchPostByIdDAL } from "@/features/post/postcard/dal/post.read.dal";

/**
 * Domain Result:
 * {
 *   id,
 *   actor: {
 *     actorId,
 *     displayName,
 *     username,
 *     photoUrl,
 *     kind,
 *     vportName?,
 *     vportSlug?
 *   },
 *   text,
 *   media[],            // ✅ MULTI-MEDIA
 *   created_at,
 *   location_text?,     // ✅ add
 *   locationText?       // ✅ add
 * }
 */
export async function getPostById(postId) {
  if (!postId) throw new Error("getPostById: postId required");

  // ============================================================
  // 1️⃣ FETCH RAW POST (WITH ACTOR PRESENTATION + MEDIA)
  // ============================================================
  const { data: row, error } = await fetchPostByIdDAL(postId);

  if (error) throw error;
  if (!row) return null;

  // ============================================================
  // 2️⃣ NORMALIZE MEDIA (NEW + BACK-COMPAT)
  // ============================================================
  let media = [];

  // ✅ Prefer vc.post_media (multi)
  if (Array.isArray(row.post_media) && row.post_media.length > 0) {
    media = row.post_media
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((m) => ({
        type: m.media_type, // 'image' | 'video'
        url: m.url,
      }));
  }
  // 🧓 Backward compatibility (old single-media posts)
  else if (row.media_url) {
    media = [
      {
        type: row.media_type || "image",
        url: row.media_url,
      },
    ];
  }

  // ============================================================
  // 3️⃣ DOMAIN SHAPE (ACTOR PRESENTATION — REQUIRED)
  // ============================================================
  return {
    id: row.id,

    actor: row.actor
      ? {
          actorId: row.actor.actor_id,
          displayName: row.actor.display_name,
          username: row.actor.username,
          photoUrl: row.actor.photo_url,
          kind: row.actor.kind,
          vportName: row.actor.vport_name,
          vportSlug: row.actor.vport_slug,
        }
      : null,

    text: row.text,
    media, // ✅ carousel-ready
    created_at: row.created_at,

    // ✅ LOCATION (detail view needs this)
    location_text: row.location_text ?? null,
    locationText: row.location_text ?? null,
  };
}
