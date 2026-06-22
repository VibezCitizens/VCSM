// src/features/post/postcard/controller/getPostReactions.controller.js
// ============================================================
// Get Post Reactions Controller
// ------------------------------------------------------------
// - Read-only
// - Actor-based
// - Returns authoritative domain state
// ============================================================

import {
  fetchActorReactionDAL,
  fetchReactionSummaryDAL,
} from "../dal/postReactions.read.dal";

export async function getPostReactionsController({
  postId,
  actorId,
}) {
  if (!postId) throw new Error("postId required");
  if (!actorId) throw new Error("actorId required");

  // 1️⃣ my reaction
  const { data: actorRow, error: actorErr } =
    await fetchActorReactionDAL({ postId, actorId });

  if (actorErr) throw actorErr;

  // 2️⃣ aggregated counts
  const { data: rows, error: summaryErr } =
    await fetchReactionSummaryDAL(postId);

  if (summaryErr) throw summaryErr;

  const counts = (rows || []).reduce(
    (acc, row) => {
      acc[row.kind] = Number(row.qty);
      return acc;
    },
    { like: 0, dislike: 0, rose: 0 }
  );

  return {
    myReaction: actorRow?.reaction ?? null,
    counts,
  };
}
