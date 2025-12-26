// src/features/post/commentcard/controller/postComments.controller.js

import {
  listPostComments,
  insertPostComment,
} from "../dal/postComments.read.dal";

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
export async function createRootComment({
  postId,
  actorId,
  content,
}) {
  const row = await insertPostComment({
    postId,
    actorId,
    content,
  });

  return {
    ...row,
    replies: [],
  };
}
