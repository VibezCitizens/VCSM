// src/features/post/postcard/controller/togglePostReaction.controller.js
// ============================================================
// Toggle Post Reaction Controller
// ------------------------------------------------------------
// - Owns ALL business meaning
// - Actor-based (STRICT)
// - Uses DALs only
// - Returns domain-safe result
// ============================================================

import {
  fetchActorReactionDAL,
  fetchReactionSummaryDAL,
} from "../dal/postReactions.read.dal";

import {
  insertReactionDAL,
  updateReactionDAL,
  deleteReactionDAL,
} from "../dal/postReactions.write.dal";

import { fetchPostByIdDAL } from "../dal/post.read.dal";
import { publishVcsmNotification } from "@/features/notifications/publish";

const VALID_REACTIONS = ["like", "dislike"];

/**
 * Toggle a post reaction for an actor
 *
 * Domain Result:
 * {
 *   reaction: "like" | "dislike" | null,
 *   counts: { like: number, dislike: number, rose: number }
 * }
 */
export async function togglePostReactionController({
  postId,
  actorId,
  reaction,
}) {
  if (!postId) throw new Error("togglePostReaction: postId required");
  if (!actorId) throw new Error("togglePostReaction: actorId required");
  if (!VALID_REACTIONS.includes(reaction)) {
    throw new Error(`Invalid reaction: ${reaction}`);
  }

  // ============================================================
  // 1️⃣ READ EXISTING REACTION
  // ============================================================
  const { data: existing, error: readErr } =
    await fetchActorReactionDAL({ postId, actorId });

  if (readErr) throw readErr;

  // ============================================================
  // 2️⃣ DECIDE MUTATION (BUSINESS LOGIC)
  // ============================================================
  let nextReaction = reaction;
  let created = false;

  if (existing?.reaction === reaction) {
    // Toggle OFF — removed
    await deleteReactionDAL({ postId, actorId });
    nextReaction = null;
  } else if (existing?.reaction) {
    // Switch reaction — switched, not a new creation
    await updateReactionDAL({ postId, actorId, reaction });
  } else {
    // New reaction — created
    await insertReactionDAL({ postId, actorId, reaction });
    created = true;
  }

  // Publish only on new reaction creation (not toggle-off, not switch)
  if (created) {
    const eventKey = reaction === 'like' ? 'social.post.like' : 'social.post.dislike';
    const { data: post } = await fetchPostByIdDAL(postId);
    if (post?.actor_id) {
      publishVcsmNotification({
        recipientActorId: post.actor_id,
        actorId,
        kind: eventKey,
        objectType: 'post',
        objectId: postId,
        linkPath: `/post/${postId}`,
        context: { reaction },
      });
    }
  }

  // ============================================================
  // 3️⃣ LOAD AGGREGATED COUNTS
  // ============================================================
  const { data: summaryRows, error: summaryErr } =
    await fetchReactionSummaryDAL(postId);

  if (summaryErr) throw summaryErr;

  // ============================================================
  // 4️⃣ NORMALIZE COUNTS (DOMAIN SHAPE)
  // ============================================================
  const counts = (summaryRows || []).reduce(
    (acc, row) => {
      acc[row.kind] = Number(row.qty);
      return acc;
    },
    { like: 0, dislike: 0, rose: 0 }
  );

  // ============================================================
  // 5️⃣ DOMAIN RESULT
  // ============================================================
  return {
    reaction: nextReaction,
    counts,
  };
}
