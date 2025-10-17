// src/data/user/post/commentLikes.js
// USER-scoped comment-like API (❤️ on comments acting as the user)

import {
  likeComment as likeCore,
  unlikeComment as unlikeCore,
  isCommentLiked,
} from '@/data/reactions/commentLikes';

const TAG = '[user/commentLikes]';

export { isCommentLiked };

/**
 * Like a comment while acting as USER (not vport).
 */
export function likeComment({ commentId }) {
  if (import.meta?.env?.DEV) console.log(TAG, 'like → actingAsVport=false', { commentId });
  return likeCore({ commentId, actingAsVport: false, vportId: null });
}

/**
 * Unlike a comment while acting as USER (not vport).
 */
export function unlikeComment({ commentId }) {
  if (import.meta?.env?.DEV) console.log(TAG, 'unlike → actingAsVport=false', { commentId });
  return unlikeCore({ commentId, actingAsVport: false, vportId: null });
}

// (optional) default export — safe even if you import this one via named exports
const api = { likeComment, unlikeComment, isCommentLiked };
export default api;
