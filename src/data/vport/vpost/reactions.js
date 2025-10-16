// src/data/void/vpost/reactions.js
// VPORT-scoped reactions (👍 / 👎) for posts.
// Thin wrappers over src/data/user/post/reactions.js that guarantee
// the operation is executed as the given VPORT (actor-based).
//
// Usage:
//   import vpostReactions from '@/data/void/vpost/reactions';
//   await vpostReactions.setForPost({ postId, kind: 'like', vportId, userId });
//
// Notes:
// - `vportId` is REQUIRED here (explicit vport scope).
// - `userId` (the authed profile) is optional; the underlying actor resolver
//   can fetch it from the session if omitted.

import userReactions from '@/data/user/post/reactions';

/** Get all reactions for a post (no vport filter). */
export async function listForPost({ postId }) {
  return userReactions.listForPost({ postId });
}

/**
 * Set/toggle 'like' | 'dislike' as this VPORT.
 * @param {{ postId: string, kind: 'like'|'dislike', vportId: string, userId?: string }} args
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
 * If `kind` is provided, clears only that; otherwise clears like+dislike.
 * @param {{ postId: string, vportId: string, kind?: 'like'|'dislike', userId?: string }} args
 */
export async function clearForPost({ postId, vportId, kind, userId }) {
  if (!vportId) throw new Error('vpost.reactions.clearForPost: vportId is required');
  return userReactions.clearForPost({
    postId,
    userId: userId ?? null,
    kind, // optional
    actingAsVport: true,
    vportId,
  });
}

/**
 * Returns this VPORT’s current reaction for a post: 'like' | 'dislike' | null.
 * @param {{ postId: string, vportId: string, userId?: string }} args
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
