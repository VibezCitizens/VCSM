import { useCallback } from "react";
import {
  ctrlAcceptFollowRequest,
  ctrlDeclineFollowRequest,
} from "@/features/social/friend/request/controllers/followRequests.controller";

export function useFollowRequestActions() {
  const acceptRequest = useCallback(async ({ requesterActorId, targetActorId }) => {
    return ctrlAcceptFollowRequest({ requesterActorId, targetActorId });
  }, []);

  const declineRequest = useCallback(async ({ requesterActorId, targetActorId }) => {
    return ctrlDeclineFollowRequest({ requesterActorId, targetActorId });
  }, []);

  return {
    acceptRequest,
    declineRequest,
  };
}
