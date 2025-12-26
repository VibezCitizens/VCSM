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
 *   media[],
 *   created_at
 * }
 */
export async function getPostById(postId) {
  if (!postId) throw new Error("getPostById: postId required");

  // ============================================================
  // 1️⃣ FETCH RAW POST (WITH ACTOR PRESENTATION)
  // ============================================================
  const { data: row, error } = await fetchPostByIdDAL(postId);

  if (error) throw error;
  if (!row) return null;

  // ============================================================
  // 2️⃣ NORMALIZE MEDIA
  // ============================================================
  const media = row.media_url
    ? [
        {
          type: row.media_type,
          url: row.media_url,
        },
      ]
    : [];

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
    media,
    created_at: row.created_at,
  };
}
