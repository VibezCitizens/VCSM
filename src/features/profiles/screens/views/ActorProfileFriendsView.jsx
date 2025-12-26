// ============================================================
// ActorProfileFriendsView
// ------------------------------------------------------------
// Profile → Friends sub-view (ACTOR-BASED)
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import RankedFriendsPublic from "@/features/profiles/screens/views/tabs/friends/components/RankedFriendsPublic";
import FriendsList from "@/features/profiles/screens/views/tabs/friends/components/FriendsList";

import { useIdentity } from "@/state/identity/identityContext";
import { fetchTopFriendActorIds } from "@/features/profiles/screens/views/tabs/friends/dal/friends.read.dal";
import { hydrateActorsIntoStore } from "@/features/profiles/screens/views/tabs/friends/helpers/hydrateActorsIntoStore";

/**
 * ActorProfileFriendsView
 *
 * @param {string}  profileActorId   Actor being viewed
 * @param {boolean} canViewContent   Privacy gate (resolved upstream)
 */
export default function ActorProfileFriendsView({
  profileActorId,
  canViewContent,
}) {
  const navigate = useNavigate();
  const { identity } = useIdentity();

  const viewerActorId = identity?.actorId;
  const isOwnProfile = viewerActorId === profileActorId;

  // ============================================================
  // TOP FRIENDS (RANKED)
  // ============================================================

  const [topFriendIds, setTopFriendIds] = useState([]);
  const [loadingTop, setLoadingTop] = useState(true);

  useEffect(() => {
    if (!profileActorId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoadingTop(true);

        const ids = await fetchTopFriendActorIds(profileActorId, 10);
        await hydrateActorsIntoStore(ids);

        if (!cancelled) {
          setTopFriendIds(ids);
        }
      } catch (err) {
        console.error(
          "[ActorProfileFriendsView] failed to load top friends",
          err
        );
        if (!cancelled) {
          setTopFriendIds([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingTop(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profileActorId]);

  // ============================================================
  // RENDER
  // ============================================================

  const isPrivate = !canViewContent && !isOwnProfile;

  return (
    <div className="space-y-8">

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
                    `/profile/${profileActorId}/friends/edit`
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
