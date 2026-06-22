// src/features/post/commentcard/controller/deleteComment.controller.js
import { softDeleteCommentDAL } from "@/features/post/commentcard/dal/comments.dal";

export async function softDeleteCommentController({ actorId, commentId }) {
  if (!actorId) return { ok: false, error: new Error("actorId required") };
  if (!commentId) return { ok: false, error: new Error("commentId required") };

  const { data, error } = await softDeleteCommentDAL({ actorId, commentId });

  if (error) return { ok: false, error };
  if (!data)
    return { ok: false, error: new Error("Comment not found or not owned") };

  return { ok: true, comment: data };
}
