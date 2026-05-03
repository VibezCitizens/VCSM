import PhotoGrid from "./tabs/photos/components/PhotoGrid";
import { useActorPosts } from "@/features/profiles/screens/views/tabs/post/hooks/useActorPosts";

export default function ActorProfilePhotosView({
  actorId,
  viewerActorId,
  canViewContent,
  handleShare,
}) {
  const { posts, loading } = useActorPosts(actorId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-white/50">
        Loading photos...
      </div>
    );
  }

  if (!canViewContent) {
    return (
      <div className="flex items-center justify-center py-10 text-white/40">
        This content is private.
      </div>
    );
  }

  if (!actorId) {
    return (
      <div className="flex items-center justify-center py-10 text-white/40">
        Profile unavailable.
      </div>
    );
  }

  if (!viewerActorId) {
    return (
      <div className="flex items-center justify-center py-10 text-white/40">
        Viewer unavailable.
      </div>
    );
  }

  return (
    <PhotoGrid
      posts={posts}
      actorId={viewerActorId}
      handleShare={handleShare}
    />
  );
}
