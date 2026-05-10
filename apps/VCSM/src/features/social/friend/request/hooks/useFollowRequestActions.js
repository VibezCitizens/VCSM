import { useCallback } from "react";
import {
  ctrlAcceptFollowRequest,
  ctrlDeclineFollowRequest,
} from "@/features/social/friend/request/controllers/followRequests.controller";
import { useFollowRequestsStore } from "@/state/social/followRequestsStore";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";

export function useFollowRequestActions() {
  const invalidate = useFollowRequestsStore((s) => s.invalidate);
  const { identity } = useIdentity();
  const sessionActorId = identity?.actorId ?? null;

  const acceptRequest = useCallback(async ({ requesterActorId, targetActorId }) => {
    const result = await ctrlAcceptFollowRequest({
      requesterActorId,
      targetActorId,
      assertingActorId: sessionActorId,
    });
    invalidate();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("noti:refresh"));
    }
    return result;
  }, [invalidate, sessionActorId]);

  const declineRequest = useCallback(async ({ requesterActorId, targetActorId }) => {
    const result = await ctrlDeclineFollowRequest({
      requesterActorId,
      targetActorId,
      assertingActorId: sessionActorId,
    });
    invalidate();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("noti:refresh"));
    }
    return result;
  }, [invalidate, sessionActorId]);

  return {
    acceptRequest,
    declineRequest,
  };
}
