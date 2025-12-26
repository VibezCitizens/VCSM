// src/data/void/vpost/reactions.js
// VPORT-scoped reactions (👍 / 👎) for posts.
// Thin wrappers over src/data/user/post/reactions.js (same signatures).

import userReactions from '@/features/post/dal/reactions';

/** Get all reactions for a post (no vport filter). */
export async function listForPost({ postId }) {
  return userReactions.listForPost({ postId });
}

/**
 * Set/toggle 'like' | 'dislike' as this VPORT.
 */
export async function setForPost({ postId, kind, vportId, userId }) {
  if (!vportId) throw new Error('vpost.reactions.setForPost: vportId is required');
  return userReactions.setForPost({
    postId,
    kind,
    userId: userId ?? null,
    actingAsVport: true,
    vportId,
  });
}

/**
 * Clear this VPORT’s reaction(s) for a post.
 */
export async function clearForPost({ postId, vportId, kind, userId }) {
  if (!vportId) throw new Error('vpost.reactions.clearForPost: vportId is required');
  return userReactions.clearForPost({
    postId,
    userId: userId ?? null,
    kind, // ignored internally (single row deletion)
    actingAsVport: true,
    vportId,
  });
}

/**
 * Returns this VPORT’s current reaction for a post.
 */
export async function getMyReactionForPost({ postId, vportId, userId }) {
  if (!vportId) throw new Error('vpost.reactions.getMyReactionForPost: vportId is required');
  return userReactions.getMyReactionForPost({
    postId,
    userId: userId ?? null,
    actingAsVport: true,
    vportId,
  });
}

const vpostReactions = {
  listForPost,
  setForPost,
  clearForPost,
  getMyReactionForPost,
};
export default vpostReactions;
