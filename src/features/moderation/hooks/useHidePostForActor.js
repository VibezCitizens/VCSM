import { useCallback } from "react";
import { hidePostForActor } from "@/features/moderation/controllers/postVisibility.controller";

export function useHidePostForActor() {
  return useCallback(async ({ actorId, postId, reportId = null, reason = "user_reported" }) => {
    if (!actorId || !postId) {
      throw new Error("actorId and postId are required");
    }

    return hidePostForActor({
      actorId,
      postId,
      reportId,
      reason,
    });
  }, []);
}
