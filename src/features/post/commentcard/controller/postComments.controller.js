// src/features/post/commentcard/controller/postComments.controller.js

import { listPostComments } from "../dal/postComments.read.dal";

// ✅ use the real DAL writer that supports parentId
import { createComment } from "../dal/comments.dal";

/**
 * Build a nested comment tree from flat rows
 * Controller-owned (structure is domain meaning)
 */
export function buildTree(rows) {
  const map = {};
  const roots = [];

  for (const row of rows) {
    map[row.id] = {
      ...row,
      replies: [],
    };
  }

  for (const row of rows) {
    if (row.parent_id) {
      map[row.parent_id]?.replies.push(map[row.id]);
    } else {
      roots.push(map[row.id]);
    }
  }

  return roots;
}

/**
 * Load full comment thread for a post
 * - Pure read
 * - No hydration here
 */
export async function loadCommentThread(postId) {
  if (!postId) return [];

  const rows = await listPostComments(postId);
  return buildTree(rows);
}

/**
 * Create a new root-level comment
 * - Returns raw comment row + replies placeholder
 */
export async function createRootComment({ postId, actorId, content }) {
  const row = await createComment({
    postId,
    actorId,
    content,
    parentId: null,
  });

  return {
    ...row,
    replies: [],
  };
}

/**
 * ✅ Create a reply to an existing comment (top spark reply)
 * - Returns raw reply row + replies placeholder
 */
export async function createReplyComment({
  postId,
  actorId,
  parentCommentId,
  content,
}) {
  if (!postId || !actorId || !parentCommentId) return null;

  const row = await createComment({
    postId,
    actorId,
    content,
    parentId: parentCommentId, // ✅ THIS is the link
  });

  return {
    ...row,
    replies: [],
  };
}
