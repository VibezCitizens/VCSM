// src/lib/postReactions.js
import { db } from '@/data/data';

/**
 * Toggle/switch a like/dislike for a *user post* via the DAL.
 * - Passing the same type again removes it (toggle off)
 * - Passing the other type switches it
 *
 * @param {string} postId
 * @param {string} userId
 * @param {'like'|'dislike'} type
 * @param {Object} [opts]
 * @param {'user'|'vport'} [opts.authorType='user']  // change if you ever call this for vport posts
 * @param {boolean} [opts.actingAsVport=false]
 * @param {string|null} [opts.vportId=null]
 */
export async function toggleReaction(postId, userId, type, opts = {}) {
  const {
    authorType = 'user',
    actingAsVport = false,
    vportId = null,
  } = opts;

  if (!postId || !userId || !type) throw new Error('Missing params');

  return db.reactions.setForPost({
    authorType,
    postId,
    kind: type,
    userId,
    actingAsVport,
    vportId,
  });
}

/**
 * Give roses (unlimited) to a *user post* via the DAL.
 * @param {string} postId
 * @param {string} userId
 * @param {number} [qty=1]
 */
export async function sendRose(postId, userId, qty = 1) {
  if (!postId || !userId) throw new Error('Missing params');
  return db.roses.give({ postId, fromUserId: userId, qty });
}
