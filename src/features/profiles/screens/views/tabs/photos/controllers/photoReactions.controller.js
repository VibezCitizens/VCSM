// src/features/profiles/screens/views/tabs/photos/controllers/photoReactions.controller.js

// DALs (dumb, explicit)
import { listPostReactions } from "../dal/listPostReactions.dal";
import { listPostCommentsCount } from "../dal/listPostCommentsCount.dal";
import { toggleReaction } from "../dal/toggleReaction.dal";

// Model (pure meaning)
import { enrichPostsModel } from "../models/enrichPosts.model";

/**
 * ============================================================
 * Photo Reactions Controller
 * ------------------------------------------------------------
 * Owns orchestration + authority
 * Delegates meaning to model
 * ============================================================
 */

/**
 * Enrich image posts with reaction + comment metadata
 */
export async function enrichPhotoPostsController({ posts, actorId }) {
  if (!actorId) throw new Error("Missing actorId");
  if (!posts?.length) return [];

  const postIds = posts.map((p) => p.id);

  // ----------------------------------------------------------
  // DATABASE STATE (DAL)
  // ----------------------------------------------------------
  const reactions = await listPostReactions(postIds);
  const commentCounts = await listPostCommentsCount(postIds);

  // ----------------------------------------------------------
  // DOMAIN MEANING (MODEL)
  // ----------------------------------------------------------
  return enrichPostsModel({
    posts,
    reactions,
    commentCounts,
    viewerActorId: actorId,
  });
}

/**
 * Toggle like / dislike reaction
 */
export async function togglePhotoReactionController({
  postId,
  actorId,
  reaction,
}) {
  if (!actorId) throw new Error("Missing actorId");
  if (!postId) throw new Error("Missing postId");

  await toggleReaction({
    postId,
    actorId,
    reaction,
  });
}

/**
 * Send rose gift
 * (kept actor-explicit, DB enforces truth)
 */
export async function sendPhotoRoseController({
  postId,
  actorId,
  qty = 1,
}) {
  if (!actorId) throw new Error("Missing actorId");
  if (!postId) throw new Error("Missing postId");

  // roses are NOT toggles → direct insert DAL lives elsewhere
  await import(
    "@/features/post/postcard/dal/roseGifts.actor.dal"
  ).then(({ default: RoseGiftsActorDAL }) =>
    RoseGiftsActorDAL.give({
      postId,
      actorId,
      qty,
    })
  );
}
