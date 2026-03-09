import { listPostReactions } from "@/features/profiles/dal/photos/listPostReactions.dal";
import { listPostCommentsCount } from "@/features/profiles/dal/photos/listPostCommentsCount.dal";
import { listPostRoseCount } from "@/features/profiles/dal/photos/listPostRoseCount.dal";
import { enrichPhotoPostsModel } from "@/features/profiles/model/photos/enrichPhotoPosts.model";
import {
  togglePostReactionController,
  sendRoseController,
} from "@/features/post/adapters/postcard/postReactions.adapter";

/**
 * Enrich image posts with reaction + comment metadata.
 *
 * viewerActorId is the logged-in viewer.
 * post.actor_id is the post owner.
 */
export async function enrichPhotoPostsController({
  posts,
  viewerActorId,
  actorId,
}) {
  const viewerId = viewerActorId ?? actorId;

  if (!viewerId) throw new Error("Missing viewerActorId");
  if (!Array.isArray(posts) || posts.length === 0) return [];

  const postIds = posts.map((p) => p?.id).filter(Boolean);
  if (!postIds.length) return [];

  const reactions = await listPostReactions(postIds);
  const commentCounts = await listPostCommentsCount(postIds);
  const roseCounts = await listPostRoseCount(postIds);

  return enrichPhotoPostsModel({
    posts,
    reactions,
    commentCounts,
    roseCounts,
    viewerActorId: viewerId,
  });
}

/**
 * Toggle like/dislike using post feature authority.
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
 * Send rose using post feature authority.
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
