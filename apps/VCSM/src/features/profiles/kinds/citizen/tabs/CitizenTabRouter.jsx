import CitizenPostsTab from "./posts/CitizenPostsTab";
import CitizenPhotosTab from "./photos/CitizenPhotosTab";
import CitizenVideosTab from "./videos/CitizenVideosTab";
import CitizenTagsTab from "./tags/CitizenTagsTab";
import CitizenFriendsTab from "./friends/CitizenFriendsTab";

export default function CitizenTabRouter({
  tab,
  profileActorId,
  viewerActorId,
  canViewContent,
  isCitizenProfile,
  isProfileOwner,
  gateVersion,
  onShare,
  onOpenMenu,
}) {
  return (
    <div className="profiles-shell px-4 pb-24">
      {/* Posts always mounted — preserves scroll position and avoids re-fetch on tab switch */}
      <div
        style={{ display: tab === "posts" ? undefined : "none" }}
        aria-hidden={tab !== "posts"}
      >
        <CitizenPostsTab
          profileActorId={profileActorId}
          canViewContent={canViewContent}
          onShare={onShare}
          onOpenMenu={onOpenMenu}
        />
      </div>

      {tab === "photos" && (
        <CitizenPhotosTab
          profileActorId={profileActorId}
          viewerActorId={viewerActorId}
          canViewContent={canViewContent}
          onShare={onShare}
        />
      )}

      {tab === "videos" && <CitizenVideosTab />}

      {isCitizenProfile && tab === "tags" && (
        <CitizenTagsTab profileActorId={profileActorId} isProfileOwner={isProfileOwner} />
      )}

      {tab === "friends" && (
        <CitizenFriendsTab
          profileActorId={profileActorId}
          canViewContent={canViewContent}
          gateVersion={gateVersion}
        />
      )}
    </div>
  );
}
