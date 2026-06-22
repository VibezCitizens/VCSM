// src/features/post/postcard/controller/sendRose.controller.js
// ============================================================
// Send Rose Controller
// ------------------------------------------------------------
// - Owns business meaning
// - Actor-based (STRICT)
// - Uses DALs only
// - Returns domain-safe result
// ============================================================

import {
  insertRoseGiftDAL,
} from "@/features/post/postcard/dal/roseGifts.actor.dal";

import {
  fetchReactionSummaryDAL,
} from "@/features/post/postcard/dal/postReactions.read.dal";

import { fetchPostByIdDAL, checkPostExistsDAL } from "@/features/post/postcard/dal/post.read.dal";
import { publishVcsmNotification } from "@/features/notifications/adapters/notifications.adapter";

/**
 * Send roses to a post
 *
 * Domain Result:
 * {
 *   counts: { like: number, dislike: number, rose: number }
 * }
 */
export async function sendRoseController({
  postId,
  actorId,
  qty = 1,
}) {
  // ============================================================
  // 1️⃣ VALIDATE INTENT
  // ============================================================
  if (!postId) throw new Error("sendRose: postId required");
  if (!actorId) throw new Error("sendRose: actorId required");
  if (!qty || qty <= 0) {
    throw new Error("sendRose: qty must be > 0");
  }

  // ============================================================
  // 0️⃣ GUARD — reject interactions on deleted posts
  // ============================================================
  const postExists = await checkPostExistsDAL(postId);
  if (!postExists) throw new Error("This post is no longer available.");

  // ============================================================
  // 2️⃣ WRITE (RAW MUTATION)
  // ============================================================
  const { error: writeErr } = await insertRoseGiftDAL({
    postId,
    actorId,
    qty,
  });

  if (writeErr) throw writeErr;

  // Post-insert reads are independent — run in parallel to save one round-trip.
  const [{ data: post }, { data: rows, error: readErr }] = await Promise.all([
    fetchPostByIdDAL(postId),
    fetchReactionSummaryDAL(postId),
  ]);

  // Publish rose notification — always a creation, never toggled
  if (post?.actor_id) {
    publishVcsmNotification({
      recipientActorId: post.actor_id,
      actorId,
      kind: 'social.post.rose',
      objectType: 'post',
      objectId: postId,
      linkPath: `/post/${postId}`,
      context: { qty },
    });
  }

  // ============================================================
  // 3️⃣ READ (AGGREGATED COUNTS — RPC)
  // ============================================================

  if (readErr) throw readErr;

  // ============================================================
  // 4️⃣ DOMAIN SHAPING (MEANING LIVES HERE)
  // ============================================================
  const counts = (rows || []).reduce(
    (acc, row) => {
      acc[row.kind] = Number(row.qty);
      return acc;
    },
    { like: 0, dislike: 0, rose: 0 }
  );

  // ============================================================
  // 5️⃣ DOMAIN RESULT
  // ============================================================
  return { counts };
}
