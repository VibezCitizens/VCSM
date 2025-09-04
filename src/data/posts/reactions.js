// src/data/posts/reactions.js
// Router over user-post vs vport-post reaction implementations.

import {
  setForUserPost,
  listForUserPost,
  clearForUserPost,
} from './reactions.user';

import {
  setForVportPost,
  listForVportPost,
  clearForVportPost, // make sure this exists; simple delete by (post_id,user_id,actor_key) in reactions.vport.js
} from './reactions.vport';

/**
 * Upsert a reaction for a post (user or vport).
 * Params:
 *   authorType: 'user' | 'vport'
 *   postId: string
 *   kind: 'like' | 'dislike'
 *   userId: string (auth user)
 *   actingAsVport?: boolean
 *   vportId?: string (when acting as vport on user posts, or actor on vport posts)
 */
export async function setForPost({
  authorType,
  postId,
  kind,
  userId,
  actingAsVport = false,
  vportId = null,
}) {
  if (authorType === 'vport') {
    // Reactions for VPORT posts live in vport_post_reactions.
    // We pass actorVportId only if actually acting as a vport (else null → user context).
    return setForVportPost({
      postId,
      kind,
      userId,
      actorVportId: actingAsVport ? vportId : null,
    });
  }

  // Regular USER posts use the split tables:
  //  - post_reactions_user (as_vport=false)
  //  - post_reactions_vport (as_vport=true; user_id = vportId)
  return setForUserPost({
    postId,
    kind,
    userId,
    actingAsVport,
    vportId,
  });
}

/**
 * List reactions for a post, normalized to:
 *  { id, post_id, user_id, reaction, created_at, as_vport, actor_vport_id }
 */
export async function listForPost({ authorType, postId }) {
  if (authorType === 'vport') {
    return listForVportPost({ postId });
  }
  return listForUserPost({ postId });
}

/**
 * Clear (remove) the caller’s reaction on a post.
 * For user posts: deletes from the appropriate table depending on actingAsVport.
 * For vport posts: deletes row keyed by (post_id, user_id, actor_key) derived from actorVportId.
 */
export async function clearForPost({
  authorType,
  postId,
  userId,
  actingAsVport = false,
  vportId = null,
}) {
  if (authorType === 'vport') {
    if (typeof clearForVportPost !== 'function') {
      throw new Error('clearForVportPost is not implemented');
    }
    return clearForVportPost({
      postId,
      userId,
      actorVportId: actingAsVport ? vportId : null,
    });
  }

  return clearForUserPost({
    postId,
    userId,
    actingAsVport,
    vportId,
  });
}

/* Optional default export for extra compatibility */
export default {
  setForPost,
  listForPost,
  clearForPost,
};
