// src/data/vport/vpost/comments.js
// VPORT-scoped comments for posts.
// Thin wrappers over src/data/user/post/comments that guarantee
// the operation is executed as a VPORT (actor-based).
//
// Usage examples:
//   import vComments from '@/data/vport/vpost/comments';
//   await vComments.create({ postId, userId, vportId, content: 'Hi' });
//   const list = await vComments.listTopLevel({ postId });
//   await vComments.update({ id: commentId, userId, vportId, content: 'Edit' });
//   await vComments.remove({ id: commentId, userId, vportId });
//
// Notes:
// - `vportId` is REQUIRED for any write (create/update/delete).
// - `postId` is the vc.posts.id of the post you’re commenting on.
// - VPORT posts are now **threaded** (nested replies supported).v

import userComments from '@/features/post/dal/comments';

/* ------------------------ helpers ------------------------ */

function required(val, msg) {
  if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
    throw new Error(msg);
  }
  return val;
}

/* ------------------------- reads ------------------------- */

/**
 * List top-level comments for a post authored by anyone (user or vport).
 * @param {{ postId: string, limit?: number }} params
 */
export async function listTopLevel({ postId, limit } = {}) {
  required(postId, 'vpost.comments.listTopLevel: postId is required');
  // Reuse the user DAL; it ignores authorType for reads and returns normalized rows
  return userComments.listTopLevel({ authorType: 'vport', postId, limit });
}

/**
 * List replies for a parent comment on a VPORT post (threaded).
 * @param {string|{ parentId: string }} arg
 */
export async function listReplies(arg) {
  return userComments.listReplies(arg);
}

/* ------------------------- writes ------------------------ */

/**
 * Create a comment on a post as a VPORT.
 * @param {{
 *   postId?: string,            // preferred
 *   vportPostId?: string,       // legacy alias → normalized to postId
 *   userId: string,             // authed profile id
 *   vportId: string,            // REQUIRED: which vport you're acting as
 *   content: string,
 *   parentId?: string|null      // ✅ threaded: pass through when replying
 * }} args
 */
export async function create({
  postId,
  vportPostId,
  userId,
  vportId,
  content,
  parentId = null,
}) {
  const pid = postId ?? vportPostId;
  required(pid,      'vpost.comments.create: postId is required');
  required(userId,   'vpost.comments.create: userId is required');
  required(vportId,  'vpost.comments.create: vportId is required');
  required(content,  'vpost.comments.create: content is required');

  // Force VPORT context — correct prop names for the user DAL
  return userComments.create({
    authorType: 'vport',
    postId: pid,
    userId,
    content,
    parentId,                // ✅ allow threading
    actingAsVport: true,
    vportId,
  });
}

/**
 * Update a comment that was created as a VPORT.
 * @param {{
 *   id: string,
 *   userId: string,
 *   vportId: string,         // REQUIRED to satisfy RLS/ownership
 *   content: string
 * }} args
 */
export async function update({ id, userId, vportId, content }) {
  required(id,       'vpost.comments.update: id is required');
  required(userId,   'vpost.comments.update: userId is required');
  required(vportId,  'vpost.comments.update: vportId is required');
  required(content,  'vpost.comments.update: content is required');

  return userComments.update({
    authorType: 'vport',
    id,
    userId,
    content,
    actingAsVport: true,
    vportId,
  });
}

/**
 * Delete a comment that was created as a VPORT.
 * @param {{
 *   id: string,
 *   userId: string,
 *   vportId: string          // REQUIRED to satisfy RLS/ownership
 * }} args
 */
export async function remove({ id, userId, vportId }) {
  required(id,       'vpost.comments.remove: id is required');
  required(userId,   'vpost.comments.remove: userId is required');
  required(vportId,  'vpost.comments.remove: vportId is required');

  return userComments.remove({
    authorType: 'vport',
    id,
    userId,
    actingAsVport: true,
    vportId,
  });
}

/* ------------------------- export ------------------------ */

const vpostComments = {
  listTopLevel,
  listReplies,
  create,
  update,
  remove,
};

export default vpostComments;
