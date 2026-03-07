import { useFriendLists } from "@/features/profiles/screens/views/tabs/friends/hooks/useFriendLists";
import ProfileFriendItem from "@/features/profiles/screens/views/tabs/friends/ui/ProfileFriendItem";
import FriendListSection from "@/features/profiles/screens/views/tabs/friends/components/FriendListSection";
import FriendsEmptyState from "@/features/profiles/screens/views/tabs/friends/components/FriendsEmptyState";

/**
 * FriendsList
 *
 * @param {string} actorId        Profile actor being viewed
 * @param {boolean} isPrivate     Profile privacy gate
 * @param {boolean} isOwnProfile  Viewer === profile owner
 */
export default function FriendsList({
  actorId,
  isPrivate,
  isOwnProfile,
}) {
  const { mutual, iAmFan, myFans, loading } = useFriendLists(actorId);

  /* ============================================================
     PRIVACY GATE
     ============================================================ */
  if (isPrivate) {
    return (
      <p className="profiles-subcard text-sm text-slate-300/80 py-4 px-4">
        This list is private.
      </p>
    );
  }

  /* ============================================================
     LOADING
     ============================================================ */
  if (loading) {
    return (
      <p className="profiles-subcard text-sm text-slate-300/80 py-4 px-4">
        Loading friends…
      </p>
    );
  }

  /* ============================================================
     EMPTY STATE
     ============================================================ */
  if (!mutual.length && !iAmFan.length && !myFans.length) {
    return <FriendsEmptyState label="No connections yet." />;
  }

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="space-y-6 mt-6">

      {/* ================= PUBLIC ================= */}
      <FriendListSection
        title="Mutual Friends"
        ids={mutual}
        renderItem={(id) => (
          <ProfileFriendItem key={id} actorId={id} />
        )}
      />

      {/* ================= OWNER ONLY ================= */}
      {isOwnProfile && (
        <FriendListSection
          title="I'm a Fan"
          ids={iAmFan}
          renderItem={(id) => (
            <ProfileFriendItem key={id} actorId={id} />
          )}
        />
      )}

      {isOwnProfile && (
        <FriendListSection
          title="My Fans"
          ids={myFans}
          renderItem={(id) => (
            <ProfileFriendItem key={id} actorId={id} />
          )}
        />
      )}

    </div>
  );
}
