import { useCallback } from "react";
import { softDeletePostController } from "@/features/post/postcard/controller/deletePost.controller";

export function useDeletePostAction({ actorId }) {
  return useCallback(
    async ({ postId }) => {
      if (!actorId) return { ok: false, error: new Error("actorId required") };
      if (!postId) return { ok: false, error: new Error("postId required") };

      return softDeletePostController({
        actorId,
        postId,
      });
    },
    [actorId]
  );
}
