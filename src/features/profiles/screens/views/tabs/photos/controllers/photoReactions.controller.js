// src/features/profiles/screens/views/tabs/photos/controllers/photoReactions.controller.js

// DALs (read-only, bulk)
import { listPostReactions } from "../dal/listPostReactions.dal";
import { listPostCommentsCount } from "../dal/listPostCommentsCount.dal";
import { listPostRoseCount } from "../dal/listPostRoseCount.dal";

// Model (pure meaning)
import { enrichPostsModel } from "../models/enrichPosts.model";

// ✅ WRITE AUTHORITY: Post feature
import { togglePostReactionController } from "@/features/post/postcard/controller/togglePostReaction.controller";
import { sendRoseController } from "@/features/post/postcard/controller/sendRose.controller";

/**
 * Enrich image posts with reaction + comment metadata
 *
 * IMPORTANT:
 * - viewerActorId = the logged-in viewer (who reacted)
 * - post.actor_id = the owner of the post (different thing)
 */
export async function enrichPhotoPostsController({
  posts,
  viewerActorId,
  actorId, // backward compat alias (older callers)
}) {
  const viewerId = viewerActorId ?? actorId;

  if (!viewerId) throw new Error("Missing viewerActorId");
  if (!Array.isArray(posts) || posts.length === 0) return [];

  const postIds = posts.map((p) => p?.id).filter(Boolean);
  if (!postIds.length) return [];

  const reactions = await listPostReactions(postIds);
  const commentCounts = await listPostCommentsCount(postIds);
  const roseCounts = await listPostRoseCount(postIds);

  return enrichPostsModel({
    posts,
    reactions,
    commentCounts,
    roseCounts,
    viewerActorId: viewerId,
  });
}

/**
 * Toggle like / dislike (delegated to Post feature)
 */
export async function togglePhotoReactionController({
  postId,
  actorId, // this one really IS the viewer actor id
  reaction,
}) {
  if (!actorId) throw new Error("Missing actorId");
  if (!postId) throw new Error("Missing postId");

  await togglePostReactionController({
    postId,
    actorId,
    reaction,
  });
}

/**
 * Send rose (delegated to Post feature)
 *
 * ✅ IMPORTANT: export name MUST be sendPhotoRoseController
 */
export async function sendPhotoRoseController({
  postId,
  actorId, // viewer actor id
  qty = 1,
}) {
  if (!actorId) throw new Error("Missing actorId");
  if (!postId) throw new Error("Missing postId");

  await sendRoseController({
    postId,
    actorId,
    qty,
  });
}
