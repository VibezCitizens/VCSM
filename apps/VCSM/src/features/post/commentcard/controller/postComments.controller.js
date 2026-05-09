// src/features/post/commentcard/controller/postComments.controller.js

import { listPostComments, readPostCommentActorIdDAL } from "../dal/postComments.read.dal";
import { createComment } from "../dal/comments.dal";
import { fetchPostByIdDAL, checkPostExistsDAL } from "@/features/post/postcard/dal/post.read.dal";
import { publishVcsmNotification } from "@/features/notifications/adapters/notifications.adapter";

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
  const postExists = await checkPostExistsDAL(postId);
  if (!postExists) throw new Error("This post is no longer available.");

  const row = await createComment({
    postId,
    actorId,
    content,
    parentId: null,
  });

  // Notify post owner about new comment
  const { data: post } = await fetchPostByIdDAL(postId);
  if (post?.actor_id) {
    publishVcsmNotification({
      recipientActorId: post.actor_id,
      actorId,
      kind: 'social.post.comment',
      objectType: 'comment',
      objectId: row.id,
      linkPath: `/post/${postId}`,
      context: { body: (content ?? '').slice(0, 120) || null },
    });
  }

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

  const postExists = await checkPostExistsDAL(postId);
  if (!postExists) throw new Error("This post is no longer available.");

  const row = await createComment({
    postId,
    actorId,
    content,
    parentId: parentCommentId,
  });

  const parentActorId = await readPostCommentActorIdDAL(parentCommentId);

  if (parentActorId) {
    publishVcsmNotification({
      recipientActorId: parentActorId,
      actorId,
      kind: 'social.post.comment_reply',
      objectType: 'comment',
      objectId: row.id,
      linkPath: `/post/${postId}`,
      context: { body: (content ?? '').slice(0, 120) || null },
    });
  }

  return {
    ...row,
    replies: [],
  };
}
