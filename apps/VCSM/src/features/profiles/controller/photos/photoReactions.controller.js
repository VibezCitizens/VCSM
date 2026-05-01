import { listPostReactions } from "@/features/profiles/dal/photos/listPostReactions.dal";
import { listPostCommentsCount } from "@/features/profiles/dal/photos/listPostCommentsCount.dal";
import { listPostRoseCount } from "@/features/profiles/dal/photos/listPostRoseCount.dal";
import { enrichPhotoPostsModel } from "@/features/profiles/model/photos/enrichPhotoPosts.model";

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

