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
 */
export async function enrichPhotoPostsController({ posts, actorId }) {
  if (!actorId) throw new Error("Missing actorId");
  if (!posts?.length) return [];

  const postIds = posts.map((p) => p.id);

  const reactions = await listPostReactions(postIds);
  const commentCounts = await listPostCommentsCount(postIds);
  const roseCounts = await listPostRoseCount(postIds);

  return enrichPostsModel({
    posts,
    reactions,
    commentCounts,
    roseCounts,
    viewerActorId: actorId,
  });
}

/**
 * Toggle like / dislike (delegated to Post feature)
 */
export async function togglePhotoReactionController({
  postId,
  actorId,
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
 * because your hook imports sendPhotoRoseController
 */
export async function sendPhotoRoseController({
  postId,
  actorId,
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
