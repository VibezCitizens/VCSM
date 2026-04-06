// ============================================================
// ActorProfileFriendsView
// ------------------------------------------------------------
// Profile → Friends sub-view (ACTOR-BASED)
// ============================================================

import { useNavigate } from "react-router-dom";

import "@/features/profiles/styles/profiles-friends-modern.css";

import RankedFriendsPublic from "@/features/profiles/screens/views/tabs/friends/components/RankedFriendsPublic";
import FriendsList from "@/features/profiles/screens/views/tabs/friends/components/FriendsList";

import { useIdentity } from "@/state/identity/identityContext";
import { useTopFriendActorIds } from "@/features/profiles/screens/views/tabs/friends/hooks/useTopFriendActorIds";

/**
 * ActorProfileFriendsView
 *
 * @param {string}  profileActorId   Actor being viewed
 * @param {boolean} canViewContent   Privacy gate (resolved upstream)
 */
export default function ActorProfileFriendsView({
  profileActorId,
  canViewContent,
  version = 0,
}) {
  const navigate = useNavigate();
  const { identity } = useIdentity();

  const viewerActorId = identity?.actorId;
  const isOwnProfile = viewerActorId === profileActorId;
  const {
    actorIds: topFriendIds,
    loading: loadingTop,
  } = useTopFriendActorIds({
    ownerActorId: profileActorId,
    limit: 10,
    version,
    reconcile: isOwnProfile,
    autofill: true,
  });

  // ============================================================
  // RENDER
  // ============================================================

  const isPrivate = !canViewContent && !isOwnProfile;

  return (
    <div className="profiles-friends-view space-y-8">
      {/* ================= TOP FRIENDS ================= */}
      {!loadingTop && (
        <RankedFriendsPublic
          actorIds={topFriendIds}
          isPrivate={isPrivate}
          isMe={isOwnProfile}
          onEdit={
            isOwnProfile
              ? () =>
                  navigate(
                    `/profile/${profileActorId}/friends/top/edit`
                  )
              : undefined
          }
        />
      )}

      {/* ================= FRIEND LIST ================= */}
      <FriendsList
        actorId={profileActorId}
        isPrivate={isPrivate}
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
}
