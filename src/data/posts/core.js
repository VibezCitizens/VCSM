// src/data/posts/core.js
// Shim that implements the "core" post operations using your existing modules.
import { create as __createUserPost, softDelete as __softDeleteUserPost } from './userPosts';
import { create as __createVportPost, hardDelete as __hardDeleteVportPost } from './vportPosts';

/**
 * Create a post authored by a USER.
 * Mirrors the API your UI expects.
 */
export async function createUserPost(args) {
  // expected fields: { userId, title?, text?, media_type?, media_url?, tags? }
  return __createUserPost(args);
}

/**
 * Create a post authored by a VPORT (brand/business identity).
 * Mirrors the API your UI expects.
 */
export async function createVportPost(args) {
  // expected fields: { vportId, createdByUserId, title?, text?, media_type?, media_url?, tags? }
  return __createVportPost(args);
}

/**
 * Soft delete a USER post (retained for audit/undo).
 */
export async function softDeleteUserPost(postId) {
  return __softDeleteUserPost(postId);
}

/**
 * Hard delete a VPORT post.
 */
export async function hardDeleteVportPost(postId) {
  return __hardDeleteVportPost(postId);
}

// Optionally export a default object if anything still imports default core.
export default {
  createUserPost,
  createVportPost,
  softDeleteUserPost,
  hardDeleteVportPost,
};
