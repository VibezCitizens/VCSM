// src/features/post/postcard/controller/deletePost.controller.js

import { softDeletePostDAL } from "@/features/post/postcard/dal/post.write.dal";

export async function softDeletePostController({ actorId, postId }) {
  if (!actorId) return { ok: false, error: new Error("actorId required") };
  if (!postId) return { ok: false, error: new Error("postId required") };

  const { data, error } = await softDeletePostDAL({ actorId, postId });

  if (error) return { ok: false, error };
  if (!data) return { ok: false, error: new Error("Post not found or not owned") };

  return { ok: true, post: data };
}
