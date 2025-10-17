// src/data/vport/vpost/commentLikes.js
// VPORT-scoped comment-like API (❤️ on comments acting as the active vport)

import {
  likeComment as likeCore,
  unlikeComment as unlikeCore,
  isCommentLiked,
} from '@/data/reactions/commentLikes';

const TAG = '[vport/commentLikes]';

export { isCommentLiked };

/**
 * Like a comment while acting as a VPORT.
 * @param {object} args
 * @param {string} args.commentId - target comment id
 * @param {string} args.vportId   - the active vport id (REQUIRED)
 */
export function likeComment({ commentId, vportId }) {
  if (!vportId) {
    const err = new Error('vport/commentLikes.likeComment: vportId required');
    if (import.meta?.env?.DEV) console.error(TAG, err.message, { commentId, vportId });
    throw err;
  }
  if (import.meta?.env?.DEV) console.log(TAG, 'like → actingAsVport=true', { commentId, vportId });
  return likeCore({ commentId, actingAsVport: true, vportId });
}

/**
 * Unlike a comment while acting as a VPORT.
 */
export function unlikeComment({ commentId, vportId }) {
  if (!vportId) {
    const err = new Error('vport/commentLikes.unlikeComment: vportId required');
    if (import.meta?.env?.DEV) console.error(TAG, err.message, { commentId, vportId });
    throw err;
  }
  if (import.meta?.env?.DEV) console.log(TAG, 'unlike → actingAsVport=true', { commentId, vportId });
  return unlikeCore({ commentId, actingAsVport: true, vportId });
}

// ✅ default export so data.js can `import vpostCommentLikes from ...`
const api = { likeComment, unlikeComment, isCommentLiked };
export default api;
