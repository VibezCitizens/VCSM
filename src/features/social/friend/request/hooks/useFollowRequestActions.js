import { useCallback } from "react";
import {
  ctrlAcceptFollowRequest,
  ctrlDeclineFollowRequest,
} from "@/features/social/friend/request/controllers/followRequests.controller";
import { useFollowRequestsStore } from "@/state/social/followRequestsStore";

export function useFollowRequestActions() {
  const invalidate = useFollowRequestsStore((s) => s.invalidate);

  const acceptRequest = useCallback(async ({ requesterActorId, targetActorId }) => {
    const result = await ctrlAcceptFollowRequest({ requesterActorId, targetActorId });
    invalidate();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("noti:refresh"));
    }
    return result;
  }, [invalidate]);

  const declineRequest = useCallback(async ({ requesterActorId, targetActorId }) => {
    const result = await ctrlDeclineFollowRequest({ requesterActorId, targetActorId });
    invalidate();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("noti:refresh"));
    }
    return result;
  }, [invalidate]);

  return {
    acceptRequest,
    declineRequest,
  };
}
