import ActorProfilePhotosView from "@/features/profiles/screens/views/ActorProfilePhotosView";

export default function VportPortfolioView({
  profile,
  posts = [],
  loadingPosts = false,
  viewerActorId = null,
  canViewContent = false,
  handleShare,
}) {
  const actorId = profile?.actorId ?? profile?.actor_id ?? null;

  return (
    <section className="profiles-card rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-white">Portfolio</div>
          <div className="mt-1 text-xs profiles-muted">
            Featured style work and image posts from this vport.
          </div>
        </div>
      </div>

      <div className="mt-4">
        <ActorProfilePhotosView
          actorId={actorId}
          viewerActorId={viewerActorId}
          posts={posts}
          loadingPosts={loadingPosts}
          canViewContent={canViewContent}
          handleShare={handleShare}
        />
      </div>

      <div className="mt-4 text-xs profiles-muted">Vport: @{profile?.username || "unknown"}</div>
    </section>
  );
}
