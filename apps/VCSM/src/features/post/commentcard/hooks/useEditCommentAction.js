import { useCallback } from "react";
import { editCommentController } from "@/features/post/commentcard/controller/editComment.controller";

export function useEditCommentAction({ actorId }) {
  return useCallback(
    async ({ commentId, text }) => {
      if (!actorId) return { ok: false, error: new Error("actorId required") };
      if (!commentId) return { ok: false, error: new Error("commentId required") };

      return editCommentController({
        actorId,
        commentId,
        text,
      });
    },
    [actorId]
  );
}
