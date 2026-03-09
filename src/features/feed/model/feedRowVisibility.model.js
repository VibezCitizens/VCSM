import { isActorBlockedForViewerModel } from "@/features/feed/model/feedBlockVisibility.model";
import { isActorFollowedByViewerModel } from "@/features/feed/model/feedFollowVisibility.model";
import { canViewPrivateFeedActorModel } from "@/features/feed/model/feedPrivateVisibility.model";

export function resolveFeedRowVisibilityModel({
  row,
  actorMap,
  profileMap,
  vportMap,
  blockedActorSet,
  followedActorSet,
  viewerActorId,
}) {
  const postId = row?.id ?? null;
  const rowActorId = row?.actor_id ?? null;

  if (
    isActorBlockedForViewerModel({
      actorId: rowActorId,
      blockedActorSet,
    })
  ) {
    return {
      post_id: postId,
      actor_id: rowActorId,
      visible: false,
      reason: "blocked_actor",
      is_private: null,
      is_following: false,
      is_owner: false,
      actor_kind: null,
    };
  }

  const actor = actorMap?.[rowActorId] ?? null;
  if (!actor) {
    return {
      post_id: postId,
      actor_id: rowActorId,
      visible: false,
      reason: "missing_actor",
      is_private: null,
      is_following: false,
      is_owner: false,
      actor_kind: null,
    };
  }

  if (actor.vport_id) {
    const isActive = vportMap?.[actor.vport_id]?.is_active !== false;
    return {
      post_id: postId,
      actor_id: rowActorId,
      visible: isActive,
      reason: isActive ? "visible_vport" : "inactive_vport",
      is_private: null,
      is_following: false,
      is_owner: actor.id === viewerActorId,
      actor_kind: actor.kind ?? "vport",
    };
  }

  const profile = profileMap?.[actor.profile_id] ?? null;
  if (!profile) {
    return {
      post_id: postId,
      actor_id: rowActorId,
      visible: false,
      reason: "missing_profile",
      is_private: null,
      is_following: false,
      is_owner: false,
      actor_kind: actor.kind ?? "user",
    };
  }

  const isFollowing = isActorFollowedByViewerModel({
    actorId: actor.id,
    followedActorSet,
  });
  const isOwner = actor.id === viewerActorId;
  const isPrivate = Boolean(profile.private);

  const canView = canViewPrivateFeedActorModel({
    isPrivate,
    isOwner,
    isFollowing,
  });

  return {
    post_id: postId,
    actor_id: rowActorId,
    visible: canView,
    reason: canView ? "visible_user" : "private_not_following",
    is_private: isPrivate,
    is_following: isFollowing,
    is_owner: isOwner,
    actor_kind: actor.kind ?? "user",
  };
}

