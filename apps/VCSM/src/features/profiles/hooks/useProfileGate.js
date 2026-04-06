import { useCallback, useMemo } from "react";
import { useFollowStatus } from "@/features/social/adapters/friend/subscribe/hooks/useFollowStatus.adapter";
import { useSendFollowRequest } from "@/features/social/adapters/friend/request/hooks/useSendFollowRequest.adapter";
import { useActorPrivacy } from "@/features/social/adapters/privacy/hooks/useActorPrivacy.adapter";

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
      : privacyLoading;

  const canView = !isPrivate || isSelf || isFollowing;

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
    isSelf,
    canView,
    requestFollow,
  };
}
