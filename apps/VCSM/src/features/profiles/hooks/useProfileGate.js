// [SHARED_ACTOR_PRIMITIVE] — privacy and access gate for both citizen and vport actors
import { useCallback, useMemo } from "react";
import { useFollowStatus } from "@/features/social/adapters/friend/subscribe/hooks/useFollowStatus.adapter";
import { useSendFollowRequest } from "@/features/social/adapters/friend/request/hooks/useSendFollowRequest.adapter";
import { useActorPrivacy } from "@/features/social/adapters/privacy/hooks/useActorPrivacy.adapter";
import { useBlockStatus } from "@/features/block/adapters/hooks/useBlockStatus.adapter";

export function useProfileGate({
  viewerActorId,
  targetActorId,
  version: _version = 0,
}) {
  const { isPrivate, loading: privacyLoading } = useActorPrivacy({
    actorId: targetActorId,
  });
  const isFollowing = useFollowStatus({
    followerActorId: viewerActorId,
    followedActorId: targetActorId,
  });
  const { isBlocked, loading: blockLoading } = useBlockStatus(viewerActorId, targetActorId);
  const sendFollowRequest = useSendFollowRequest();

  const isSelf = useMemo(
    () =>
      Boolean(
        viewerActorId &&
          targetActorId &&
          viewerActorId === targetActorId
      ),
    [viewerActorId, targetActorId]
  );

  const loading = !viewerActorId || !targetActorId
    ? true
    : isSelf
      ? false
      : privacyLoading || blockLoading;

  // Self-view always allowed. Block gates everything — no content shown in either direction.
  const canView = isSelf || (!isBlocked && (!isPrivate || isFollowing));

  const requestFollow = useCallback(async () => {
    if (!viewerActorId || !targetActorId) return false;
    if (viewerActorId === targetActorId) return false;

    try {
      await sendFollowRequest({
        requesterActorId: viewerActorId,
        targetActorId,
      });
      return true;
    } catch (err) {
      console.error("[useProfileGate.requestFollow] failed", err);
      return false;
    }
  }, [viewerActorId, targetActorId, sendFollowRequest]);

  return {
    loading,
    isPrivate,
    isFollowing,
    isBlocked,
    isSelf,
    canView,
    requestFollow,
  };
}
