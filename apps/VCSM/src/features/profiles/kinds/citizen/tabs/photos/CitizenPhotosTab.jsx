import ActorProfilePhotosView from "@/features/profiles/screens/views/ActorProfilePhotosView";

export default function CitizenPhotosTab({ profileActorId, viewerActorId, canViewContent, onShare }) {
  return (
    <ActorProfilePhotosView
      actorId={profileActorId}
      viewerActorId={viewerActorId}
      canViewContent={canViewContent}
      handleShare={onShare}
    />
  );
}
