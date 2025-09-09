// src/data/posts/index.js

// Existing modules (kept as-is)
import * as userPosts from './userPosts.js';
import * as vportPosts from './vportPosts.js';
import * as likes from './likes.js';
import * as reactions from './reactions.js';
import * as comments from './comments.js';
import * as roses from './roses.js';

// New, *independent* modules
import * as textPosts from './textPosts.js';
import * as imagePosts from './imagePosts.js';
import * as vdropPosts from './vdropPosts.js';
// Stories live under /stories to avoid coupling with posts
import * as stories from './storyUpload.js';

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

function pick(mod, names) {
  for (const n of names) if (typeof mod[n] === 'function') return mod[n];
  return null;
}
function ensure(fn, label) {
  if (typeof fn !== 'function') {
    throw new Error(`[posts/index] Missing implementation for ${label}. Add it in userPosts.js or vportPosts.js`);
  }
  return fn;
}

/* -------------------------------------------------------------------------- */
/* Back-compat wrappers for user/vport post modules                            */
/* -------------------------------------------------------------------------- */

const U = {
  listTopLevel: pick(userPosts, ['listTopLevel', 'list', 'listFeed', 'fetchTopLevel']),
  listReplies:  pick(userPosts, ['listReplies', 'replies', 'fetchReplies']),
  create:       pick(userPosts, ['create', 'createPost', 'insert']),
  update:       pick(userPosts, ['update', 'updatePost', 'patch']),
  remove:       pick(userPosts, ['remove', 'delete', 'softDelete', 'softDeletePost']),
  softDelete:   pick(userPosts, ['softDelete', 'softDeletePost', 'remove']),
};

const V = {
  listTopLevel: pick(vportPosts, ['listTopLevel', 'list', 'listFeed', 'fetchTopLevel']),
  listReplies:  pick(vportPosts, ['listReplies', 'replies', 'fetchReplies']),
  create:       pick(vportPosts, ['create', 'createPost', 'insert']),
  update:       pick(vportPosts, ['update', 'updatePost', 'patch']),
  remove:       pick(vportPosts, ['remove', 'delete', 'hardDelete', 'hardDeletePost']),
  hardDelete:   pick(vportPosts, ['hardDelete', 'hardDeletePost', 'remove']),
};

/* -------------------------------------------------------------------------- */
/* Unified Comments API (routes to comments.js)                                */
/* -------------------------------------------------------------------------- */

function resolveAuthorType(params) {
  return params?.vportId ? 'vport' : 'user';
}

export function listTopLevel(params) {
  const authorType = resolveAuthorType(params);
  return comments.listTopLevel({ authorType, postId: params.postId });
}

export function listReplies(params) {
  const parentId = params?.parentId ?? params?.id ?? params;
  return comments.listReplies(parentId);
}

export function create(params) {
  const authorType = resolveAuthorType(params);
  const {
    postId,
    vportPostId = null,
    userId,
    content,
    asVport,
    actorVportId,
    parentId = null,
  } = params || {};
  return comments.create({
    authorType,
    postId,
    vportPostId,
    userId,
    content,
    asVport,
    actorVportId,
    parentId,
  });
}

export function update(params) {
  const authorType = resolveAuthorType(params);
  const { id, userId, content, actingAsVport = false, vportId = null } = params || {};
  return comments.update({ authorType, id, userId, content, actingAsVport, vportId });
}

export function remove(params) {
  const authorType = resolveAuthorType(params);
  const { id, userId, actingAsVport = false, vportId = null } = params || {};
  return comments.remove({ authorType, id, userId, actingAsVport, vportId });
}

/* -------------------------------------------------------------------------- */
/* Named helpers explicitly expected by src/data/data.js                      */
/* -------------------------------------------------------------------------- */

export function createUserPost(payload) {
  return ensure(U.create, 'userPosts.create')(payload);
}
export function createVportPost(payload) {
  return ensure(V.create, 'vportPosts.create')(payload);
}
export function softDeleteUserPost(postId) {
  const fn = U.softDelete || U.remove;
  return ensure(fn, 'userPosts.softDelete')(postId);
}
export function hardDeleteVportPost(postId) {
  const fn = V.hardDelete || V.remove;
  return ensure(fn, 'vportPosts.hardDelete')(postId);
}

/* -------------------------------------------------------------------------- */
/* New isolated flows (text/image/vdrop/stories)                              */
/* -------------------------------------------------------------------------- */

export const createTextPost  = textPosts.createTextPost;   // actor-based, media_type=null
export const createImagePost = imagePosts.createImagePost; // actor-based, media_type='image'
export const createVdropPost = vdropPosts.createVdropPost; // actor-based, media_type='video'

export const createStory = stories.createStory;            // user/vport stories (independent)

/* -------------------------------------------------------------------------- */
/* Reactions & Roses — keep old exports + namespaces                          */
/* -------------------------------------------------------------------------- */

// Named exports (as before)
export { listForPost, setForPost, clearForPost } from './reactions.js';
export { count, give } from './roses.js';

// Also expose namespaces (some callers import these)
export { comments, reactions, roses };

/* -------------------------------------------------------------------------- */
/* Likes (named)                                                              */
/* -------------------------------------------------------------------------- */

export const { getLikes, setLike } = likes;

/* -------------------------------------------------------------------------- */
/* Default aggregate (kept for default imports)                               */
/* -------------------------------------------------------------------------- */

const api = {
  // unified comments
  listTopLevel,
  listReplies,
  create,
  update,
  remove,

  // legacy post helpers
  createUserPost,
  createVportPost,
  softDeleteUserPost,
  hardDeleteVportPost,

  // new isolated flows
  createTextPost,
  createImagePost,
  createVdropPost,
  createStory,

  // likes
  getLikes,
  setLike,

  // reactions (named)
  listForPost: reactions.listForPost,
  setForPost: reactions.setForPost,
  clearForPost: reactions.clearForPost,

  // roses (named)
  count: roses.count,
  give: roses.give,

  // namespaces
  comments,
  reactions,
  roses,

  // optional direct access
  user: userPosts,
  vport: vportPosts,
  text: textPosts,
  image: imagePosts,
  vdrop: vdropPosts,
  stories,
};

export default api;
