// src/features/post/commentcard/controller/editComment.controller.js
import { updateCommentContentDAL } from "@/features/post/commentcard/dal/comments.dal";

export async function editCommentController({ actorId, commentId, text }) {
  if (!actorId) return { ok: false, error: new Error("actorId required") };
  if (!commentId) return { ok: false, error: new Error("commentId required") };

  const trimmed = String(text ?? "").trim();
  if (!trimmed)
    return { ok: false, error: new Error("Comment cannot be empty") };

  const { data, error } = await updateCommentContentDAL({
    actorId,
    commentId,
    content: trimmed,
  });

  if (error) return { ok: false, error };
  if (!data)
    return { ok: false, error: new Error("Comment not found or not owned") };

  return { ok: true, comment: data };
}
